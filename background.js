// ===== Constants =====
const ALARM_MAIN = "gia-break";
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
  
  if (s.audioEnabled !== false) {
    try {
      // Use chrome.tts API with more natural voice settings
      chrome.tts.speak(message, {
        enqueue: false,
        voiceName: 'Feminine',  // More natural female voice
        rate: 0.9,              // Slower, more calming
        pitch: 1.0,             // Natural pitch
        volume: 0.85,           // Gentle but clear
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

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  (async () => {
    if (msg?.type === "gia.pause")  { await setSettings({ paused: true });  await clearMainAlarm(); await stopAllAudioAndNotifs(); sendResponse({ paused: true }); }
    if (msg?.type === "gia.resume") { await setSettings({ paused: false }); await createMainAlarm();                 sendResponse({ paused: false }); }
    if (msg?.type === "gia.exit")   { await setSettings({ paused: true });  await clearMainAlarm(); await stopAllAudioAndNotifs(); sendResponse({ paused: true, exited: true }); }
    if (msg?.type === "gia.status") { const s = await getSettings(); sendResponse({ paused: !!s.paused }); }
    if (msg?.type === "GIA_RESCHEDULE") { await clearMainAlarm(); await createMainAlarm(); sendResponse({ success: true }); }
  })();
  return true;
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

