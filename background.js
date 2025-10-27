// ===== Constants =====
const ALARM_MAIN = "gia-break";
// Import tone styles to ensure consistency
import { TONE_STYLES } from './toneProfiles.js';

const FIXED_SHORT_MIN = 20;        // 20-20-20 cadence (not customizable)
const SNOOZE_MIN = 5;

// ===== Store helpers =====
async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return settings;
}
async function setSettings(patch) {
  const settings = await getSettings();
  const next = { ...settings, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}
async function getCounters() {
  const { counters = {} } = await chrome.storage.local.get("counters");
  return { elapsedMin: 0, ...counters };
}
async function setCounters(patch) {
  const counters = await getCounters();
  const next = { ...counters, ...patch };
  await chrome.storage.local.set({ counters: next });
  return next;
}

// ===== Migration: old cycles -> minutes =====
async function migrateSettings() {
  const s = await getSettings();
  if (s.longEvery && !s.longEveryMinutes) {
    const minutes = Math.max(40, Number(s.longEvery) * FIXED_SHORT_MIN);
    await setSettings({ longEveryMinutes: minutes });
  }
  if (typeof s.longEnabled !== "boolean") await setSettings({ longEnabled: false });
  if (!s.longSecs) await setSettings({ longSecs: 300 }); // 5 min
  if (!s.longEveryMinutes) await setSettings({ longEveryMinutes: 60 }); // 60 min default
}

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
        url: chrome.runtime.getURL('ui/onboarding.html')
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
  if (alarm.name === 'gia-demo') {
    await runShortBreak();
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
          `ui/leaveoff.html?title=${encodeURIComponent(tab?.title || "")}&url=${encodeURIComponent(tab?.url || "")}`
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
  
  // Simple default message (AI integration happens in content script)
  const message = "Take a 20-second break: look 20 feet away and blink gently.";
  
  // Try to show break card in active tabs first
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'GIA_SHOW_BREAK',
        breakType: 'short',
        durationMs: 20000
      });
    } catch (e) {
      // Content script not loaded on this page
    }
  }
  
  if (s.audioEnabled !== false) {
    try {
      // Use chrome.tts API with more natural voice settings
      chrome.tts.speak(message, {
        enqueue: false,
        // Don't specify voiceName - let system choose best available
        rate: 0.75,             // Much slower, more calming
        pitch: 0.85,            // Lower pitch for warmth
        volume: 0.8,            // Quieter, less intimidating
        requiredEventTypes: ['end']
      });
    } catch (e) {
      console.warn('TTS failed:', e);
      // Fallback to notification
      chrome.notifications.create(`gia-short-${Date.now()}`, {
        type: "basic",
        iconUrl: "assets/logo.png",
        title: "20-20-20 break",
        message: message,
        silent: false
      });
    }
  } else {
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

// Guard to prevent duplicate demo sequences
let isDemoRunning = false;

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
        // Handle TTS requests from content scripts with tone-specific audio
        try {
          const tone = msg.tone || 'mindful';
          const profile = TONE_STYLES[tone] || TONE_STYLES.mindful;

          // Try high-quality Prompt API audio first
          if (chrome?.ai?.prompt) {
            try {
              const prompt = `${profile.promptStyle}\n"${msg.text}"`;

              const res = await chrome.ai.prompt({
                prompt,
                output_audio_format: "wav"
              });

              if (res?.output_audio) {
                // Send audio data back to content script to play
                if (sendResponse) sendResponse({
                  success: true,
                  audioData: res.output_audio,
                  audioFormat: "wav"
                });
                return; // Prevent fallback
              }
            } catch (e) {
              console.log('Prompt API audio not available, falling back to chrome.tts');
            }
          }

          // Fallback to chrome.tts with tone-specific parameters
          chrome.tts.speak(msg.text, {
            enqueue: false,
            rate: profile.rate,
            pitch: profile.pitch,
            volume: profile.volume
          });

          if (sendResponse) sendResponse({ success: true });
        } catch (e) {
          console.error('TTS speak error:', e);
          if (sendResponse) sendResponse({ error: e.message });
        }
      } else if (msg?.type === "GIA_GET_MESSAGE") {
        // Get tone from message parameter, then settings, then default
        const tone = msg.tone || (await getSettings())?.tipTone || 'mindful';
        const breakType = msg.breakType || 'short';

        let message;

        if (breakType === 'long') {
          // Long break message adapts to tone
          if (tone === 'goofy') {
            message = "Take 5. Time to touch grass but here's one for the road. Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!";
          } else {
            message = "Take a longer break. Step away from your screen, stretch your arms, and let your eyes rest. I'll let you know when time is up.";
          }
        } else {
          // Short break messages
          if (tone === 'mindful') {
            message = "Take a 20-second break. Look 20 feet away and blink gently. I'll let you know when time is up.";
          } else if (tone === 'goofy') {
            const jokes = [
              "Knock knock. Who's there? Boo. Boo who? Don't cry!",
              "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in!",
              "Knock knock. Who's there? Hawaii. Hawaii who? I'm fine, Hawaii you?",
              "Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!"
            ];
            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            message = `Look 20 feet away and blink gently. ${joke} I'll let you know when time is up.`;
          } else {
            message = "Take a 20-second break. Look 20 feet away and blink gently.";
          }
        }

        if (sendResponse) sendResponse({ text: message });
      } else if (msg?.type === 'GIA_START_DEMO') {
        if (isDemoRunning) {
          console.log('Demo already running, ignoring duplicate request');
          if (sendResponse) sendResponse({ error: 'Demo already running' });
          return;
        }
        isDemoRunning = true;

        try {
          // Find the tab with the demo page
          const url = msg.tabId; // This is actually a URL, not a tab ID
          console.log(`Starting demo sequence on page ${url}`);
          
          // Query for tabs containing demo.html
          const allTabs = await chrome.tabs.query({});
          const demoTab = allTabs.find(tab => tab.url && tab.url.includes('demo.html'));
          
          if (!demoTab) {
            console.error('Demo tab not found');
            if (sendResponse) sendResponse({ error: 'Demo tab not found' });
            return;
          }
          
          const tabId = demoTab.id;
          console.log(`Found demo tab ID: ${tabId}`);

          // Set initial demo settings
          await setSettings({
            audioEnabled: true,
            voiceCommandsEnabled: false,
            tipTone: 'mindful',
            onboardingComplete: true,
            paused: false,
          });

          // --- Sequence Start ---

          // 1. Mindful Break (after a short delay)
          console.log('Demo: Triggering Mindful break...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to be ready
          
          // Stop any existing audio
          try { chrome.tts.stop(); } catch (e) {}
          
          await chrome.tabs.sendMessage(tabId, {
            type: 'GIA_SHOW_BREAK',
            breakType: 'short',
            durationMs: 20000,
            tone: 'mindful'
          });

          // 2. Long Break with Goofy tone (after the first one finishes)
          console.log('Demo: Scheduling Long break...');
          await new Promise(resolve => setTimeout(resolve, 22000)); // 20s break + 2s buffer
          
          // Explicitly dismiss previous card and stop audio
          try { chrome.tts.stop(); } catch (e) {}
          await chrome.tabs.sendMessage(tabId, { type: 'GIA_DISMISS_BREAK' }).catch(() => {});
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for dismiss animation
          
          await setSettings({ tipTone: 'goofy' });
          await new Promise(resolve => setTimeout(resolve, 500));
          await chrome.tabs.sendMessage(tabId, {
            type: 'GIA_SHOW_BREAK',
            breakType: 'long',
            durationMs: 30000, // 30 seconds for demo purposes
            tone: 'goofy'
          });

          // --- Sequence End ---
          console.log('Demo sequence complete.');
          if (sendResponse) sendResponse({ success: true });

          // Reset demo flag after sequence (20s mindful + 30s goofy long)
          const totalDemoTime = 22000 + 32000;
          setTimeout(() => { isDemoRunning = false; }, totalDemoTime);

        } catch (e) {
          console.error('Demo start error:', e);
          isDemoRunning = false;
          if (sendResponse) sendResponse({ error: e.message });
        }
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
