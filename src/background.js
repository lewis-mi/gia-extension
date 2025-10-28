// ===== Constants =====
const ALARM_MAIN = "gia-break";
// Import message generator
import { generateBreakMessage } from './ai/message-generator.js';

// Import TTS handler
import { speakWithTTS } from './lib/tts-handler.js';

// Import settings storage
import { getSettings, setSettings, getCounters, setCounters, migrateSettings } from './lib/settings-storage.js';
import { runDemoStep, findDemoTab } from './lib/demo-sequence.js';

const FIXED_SHORT_MIN = 20;        // 20-20-20 cadence (not customizable)
const SNOOZE_MIN = 5;
let demoStartTimeout = null;

// ===== Offscreen guard (for AI/TTS stability) =====
async function ensureOffscreen() {
  if (!chrome.offscreen?.hasDocument) return;
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["BLOBS"],
      justification: "Run on-device AI & TTS reliably"
    });
  }
}

// ===== Alarms =====
async function createMainAlarm(delayMinutes = 0) {
  const s = await getSettings();
  if (s.paused) return;
  const opts = delayMinutes > 0
    ? { delayInMinutes: delayMinutes, periodInMinutes: FIXED_SHORT_MIN }
    : { periodInMinutes: FIXED_SHORT_MIN };
  chrome.alarms.create(ALARM_MAIN, opts);
}
async function clearMainAlarm() { await chrome.alarms.clear(ALARM_MAIN); }

// ===== Install/Startup =====
chrome.runtime.onInstalled.addListener(async (details) => {
  await migrateSettings();
  
  // Check if this is the first install (not an update)
  if (details.reason === 'install') {
    // Check if onboarding has been completed
    const { onboardingComplete } = await chrome.storage.local.get('onboardingComplete');
    
    if (!onboardingComplete) {
      // Open onboarding page for new users
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/ui/onboarding.html')
      });
    }
  }
  
  await createMainAlarm();
});
chrome.runtime.onStartup.addListener(async () => {
  await migrateSettings();
  await createMainAlarm();
});

// ===== Short / Long break triggers =====
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Handle demo alarm for quick testing
  if (alarm.name === 'gia-demo' && demoStartTimeout) {
    clearTimeout(demoStartTimeout);
    demoStartTimeout = null;
  }

  if (alarm.name === 'gia-demo') {
    await runDemoStep();
    return; // Stop further processing for demo alarms
  }
  
  if (alarm.name === 'gia-demo-step2') {
    await runDemoStep();
    return;
  }

  if (alarm.name !== ALARM_MAIN) return;

  const s = await getSettings();
  if (s.paused) return;

  const { elapsedMin } = await getCounters();
  const threshold = Number(s.longEveryMinutes || 60);
  const willTriggerLong = s.longEnabled && (elapsedMin + FIXED_SHORT_MIN) >= threshold;

  await ensureOffscreen();

  if (willTriggerLong) {
    await notifyLongBreak();
    await setCounters({ elapsedMin: 0 });
  } else {
    await runShortBreak(); // voice or soft notif
    await setCounters({ elapsedMin: elapsedMin + FIXED_SHORT_MIN });
  }
});

// ===== Notifications/Buttons =====
async function notifyLongBreak() {
  chrome.notifications.create(`gia-long-${Date.now()}`, {
    type: "basic",
    iconUrl: "assets/logo.png",
    title: "Time for a longer reset",
    message: "Save where you’re leaving off, then take a few minutes away.",
    requireInteraction: true,
    buttons: [{ title: "Save & start" }, { title: "Snooze 5 min" }],
    silent: true
  });
}

// Register notifications button click listener
chrome.notifications?.onButtonClicked?.addListener(async (notifId, btnIdx) => {
  if (!notifId?.startsWith("gia-")) return;

  try {
    if (btnIdx === 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        const url = chrome.runtime.getURL(
          `src/ui/leaveoff.html?title=${encodeURIComponent(tab?.title || "")}&url=${encodeURIComponent(tab?.url || "")}`
        );
        await chrome.tabs.create({ url });
        chrome.notifications?.clear(notifId);
      });
    } else if (btnIdx === 1) {
      await clearMainAlarm();
      await createMainAlarm(SNOOZE_MIN);  // resume 20-min cadence after snooze
      chrome.notifications?.clear(notifId);
    }
  } catch (e) {
    console.warn('Error handling notification button:', e);
  }
});

// ===== Short break runner =====
async function runShortBreak() {
  const s = await getSettings();

  // Try to show break card in active tabs first
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let cardShown = false;
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'GIA_SHOW_BREAK',
        breakType: 'short',
        durationMs: 20000,
        tone: s.tipTone || 'mindful'
      });
      cardShown = true;
    } catch (e) {
      // Content script not loaded on this page
    }
  }

  // If no card was shown (e.g., on a new tab page), fall back to a simple notification.
  // The card itself handles the audio, so we only do this if the card fails.
  if (!cardShown) {
    const message = "Time for a 20-second break. Look 20 feet away.";
    chrome.notifications.create(`gia-short-${Date.now()}`, {
      type: "basic",
      iconUrl: "assets/logo.png",
      title: "20-20-20 break",
      message: message,
      silent: true
    });
  }
}

// ===== Pause/Resume/Exit API =====
async function stopAllAudioAndNotifs() {
  try { chrome.tts.stop(); } catch {}
  chrome.notifications.getAll(ids => Object.keys(ids||{}).forEach(id => chrome.notifications.clear(id)));
}

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  // Handle the message asynchronously
  (async () => {
    try {
      if (msg?.type === "gia.pause") {
        await setSettings({ paused: true });
        await clearMainAlarm();
        await stopAllAudioAndNotifs();
        if (sendResponse) sendResponse({ paused: true });
      } else if (msg?.type === "gia.resume") {
        await setSettings({ paused: false });
        await createMainAlarm();
        if (sendResponse) sendResponse({ paused: false });
      } else if (msg?.type === "gia.exit") {
        await setSettings({ paused: true });
        await clearMainAlarm();
        await stopAllAudioAndNotifs();
        if (sendResponse) sendResponse({ paused: true, exited: true });
      } else if (msg?.type === "gia.status") {
        const s = await getSettings();
        if (sendResponse) sendResponse({ paused: !!s.paused });
      } else if (msg?.type === "GIA_RESCHEDULE") {
        await clearMainAlarm();
        await createMainAlarm();
        if (sendResponse) sendResponse({ success: true });
      } else if (msg?.type === "GIA_SPEAK") {
        // Handle TTS requests using the TTS handler module
        const tone = msg.tone || 'mindful';
        const response = await speakWithTTS(msg.text, tone);
        if (sendResponse) sendResponse(response);
      } else if (msg?.type === "GIA_GET_MESSAGE") {
        // Get tone from message parameter, then settings, then default
        const tone = msg.tone || (await getSettings())?.tipTone || 'mindful';
        const breakType = msg.breakType || 'short';

        // Generate message using the message generator module
        const message = generateBreakMessage(tone, breakType);

        if (sendResponse) sendResponse({ text: message });
      } else if (msg?.type === 'GIA_START_DEMO_NOW') {
        // Use setTimeout to give the demo tab time to load and inject the content script
        demoStartTimeout = setTimeout(() => {
          runDemoStep();
        }, 3000); // 3-second delay to ensure tab is ready
        
        if (sendResponse) sendResponse({ success: true });
      }
    } catch (e) {
      console.error('Message handler error:', e);
      if (sendResponse) sendResponse({ error: e.message });
    }
  })();

  return true; // Indicate we will send response asynchronously
});

// ===== Keyboard shortcut =====
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "toggle-pause") return;
  chrome.runtime.sendMessage({ type: "gia.status" }, ({ paused }) => {
    chrome.runtime.sendMessage({ type: paused ? "gia.resume" : "gia.pause" }, () => {});
  });
});
const PWA_URL = "https://giaext-1c5cd.web.app";

async function openPwaVibrate(kind = "start") {
  try { 
    await chrome.tabs.create({ url: `${PWA_URL}?vibrate=${encodeURIComponent(kind)}` }); 
  } catch (e) {
    console.warn('Could not open PWA:', e);
  }
}
