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

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  // Handle the message asynchronously
  (async () => {
    try {
      if (msg?.type === "gia.pause")  { 
        await setSettings({ paused: true });  
        await clearMainAlarm(); 
        await stopAllAudioAndNotifs(); 
        if (sendResponse) sendResponse({ paused: true }); 
      } else if (msg?.type === "gia.resume") { 
        await setSettings({ paused: false }); 
        await createMainAlarm(); 
        if (sendResponse) sendResponse({ paused: false }); 
      } else if (msg?.type === "gia.exit")   { 
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
          
          // Tone-specific audio profiles with refined characteristics
          const toneProfiles = {
            mindful: { rate: 0.9, pitch: 0.9, volume: 0.85 },
            goofy: { rate: 1.25, pitch: 1.25, volume: 1.0 }
          };
          
          const profile = toneProfiles[tone] || toneProfiles.mindful;
          
          // Try high-quality Prompt API audio first
          if (chrome?.ai?.prompt) {
            try {
              let toneStyle;
              if (tone === 'goofy') {
                toneStyle = `Speak this line in a fun, goofy tone — animated and slightly exaggerated,
like a cartoon sidekick who's excited to help. Use playful rhythm, upbeat pacing,
and big vocal expressions (smiles, laughter hints).
End each line with rising intonation or comedic timing.`;
              } else {
                toneStyle = `Speak this line in a warm, slow, and grounded tone — imagine guiding a meditation.
Use smooth rhythm, low volume, and no sudden inflection.
Pause naturally between phrases.
Do not sound robotic or overly formal.`;
              }
              
              const prompt = `${toneStyle}\n"${msg.text}"`;
              
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
              }
            } catch (e) {
              console.log('Prompt API audio not available, falling back to chrome.tts');
            }
          }
          
          // Fallback to chrome.tts with tone-specific parameters
          chrome.tts.speak(msg.text, {
            enqueue: false,
            rate: msg.rate || profile.rate,
            pitch: msg.pitch || profile.pitch,
            volume: msg.volume !== undefined ? msg.volume : profile.volume !== undefined ? profile.volume : 0.9
          });
          
          if (sendResponse) sendResponse({ success: true });
        } catch (e) {
          console.error('TTS speak error:', e);
          if (sendResponse) sendResponse({ error: e.message });
        }
      } else if (msg?.type === "GIA_GET_MESSAGE") { 
        // Get tone from settings and break type
        const settings = await getSettings();
        const tone = settings?.tipTone || 'mindful';
        const breakType = msg.breakType || 'short';
        
        let message;
        
        if (breakType === 'long') {
          // Long break has special message
          message = "Take 5. Time to touch grass but here's one for the road. Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!";
        } else {
          // Short break messages
          if (tone === 'mindful') {
            message = "Take a 20-second break. Look 20 feet away and blink gently. Let's take a little rest. I'll let you know when time is up.";
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
        // Handle demo start
        console.log('Starting demo sequence...');
        try {
          // Find the demo page tab
          const tabs = await chrome.tabs.query({ url: '*://*/demo.html' });
          if (tabs && tabs.length > 0) {
            const tab = tabs[0];
            
            // Trigger demo breaks on that tab
            await chrome.storage.local.set({
              settings: {
                audioEnabled: true,
                voiceCommandsEnabled: false,
                language: 'auto',
                tipTone: 'mindful'
              }
            });
            
            // Wait for storage to persist
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Show breaks in sequence with audio cleanup
            setTimeout(async () => {
              // Stop any existing audio before starting
              try {
                chrome.tts.stop();
              } catch (e) {}
              
              // Break 1: Mindful
              await chrome.tabs.sendMessage(tab.id, {
                type: 'GIA_SHOW_BREAK',
                breakType: 'short',
                durationMs: 20000,
                demo: true,
                tone: 'mindful'
              });
              
              setTimeout(async () => {
                // Stop any existing audio before next break
                try {
                  chrome.tts.stop();
                } catch (e) {}
                
                // Break 2: Goofy
                await chrome.storage.local.set({
                  settings: { tipTone: 'goofy' }
                });
                await new Promise(resolve => setTimeout(resolve, 300));
                
                await chrome.tabs.sendMessage(tab.id, {
                  type: 'GIA_SHOW_BREAK',
                  breakType: 'short',
                  durationMs: 20000,
                  demo: true,
                  tone: 'goofy'
                });
              }, 25000);
            }, 1000);
            
            if (sendResponse) sendResponse({ success: true });
          }
        } catch (e) {
          console.error('Demo start error:', e);
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

