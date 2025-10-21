// ===== GIA BACKGROUND SERVICE WORKER =====
// Handles scheduling, AI generation, audio, and state management

// ===== CONFIG =====
const SHORT_BREAK_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes (fixed)
const SHORT_BREAK_DURATION_MS = 20 * 1000;      // 20 seconds
const DEFAULT_SNOOZE_MIN = 5;
const ICON_STAGES = 5; // 5 stages of progression

// Icon paths for 5-stage progression
const ICONS = [
  { 16: "assets/icons/icon_0_start.png", 32: "assets/icons/icon_0_start_32.png" },
  { 16: "assets/icons/icon_1_step.png", 32: "assets/icons/icon_1_step_32.png" },
  { 16: "assets/icons/icon_2_step.png", 32: "assets/icons/icon_2_step_32.png" },
  { 16: "assets/icons/icon_3_step.png", 32: "assets/icons/icon_3_step_32.png" },
  { 16: "assets/icons/icon_4_break.png", 32: "assets/icons/icon_4_break_32.png" }
];

// ===== HELPERS =====
function minsToMs(m) { return m * 60 * 1000; }
function isEligible(tab) { return /^https?:\/\//.test(tab?.url || ""); }

async function setIcon(stage) {
  try {
    const iconIndex = Math.min(stage, ICON_STAGES - 1);
    await chrome.action.setIcon({ path: ICONS[iconIndex] });
  } catch (e) {
    console.warn('Failed to set icon:', e);
  }
}

async function getSettings() {
  const defaults = {
    sessionMinutes: 60,
    shortEnabled: true,
    longEnabled: true,
    longBreakFrequency: 60,
    longBreakDuration: 10,
    voiceEnabled: false,
    audioEnabled: true,
    tonePreference: 'mindful',
    showCornerLogo: true,
    snoozeDuration: 5,
    sessionStartTime: null,
    breakCount: 0,
    firstBreakToday: true
  };

  const settings = await chrome.storage.local.get(Object.keys(defaults));
  return { ...defaults, ...settings };
}

// ===== SCHEDULING =====
async function scheduleAll() {
  await chrome.alarms.clearAll();
  await setIcon(0);

  const { sessionMinutes, longEnabled, longBreakFrequency } = await getSettings();

  // Schedule 5 icon progression stages over 20 minutes
  const stageInterval = SHORT_BREAK_INTERVAL_MS / ICON_STAGES;
  for (let i = 1; i < ICON_STAGES; i++) {
    chrome.alarms.create(`gia-stage-${i}`, {
      when: Date.now() + stageInterval * i
    });
  }

  // Schedule short break at 20 min
  chrome.alarms.create('gia-short-break', {
    when: Date.now() + SHORT_BREAK_INTERVAL_MS
  });

  // Schedule long break if enabled
  if (longEnabled) {
    chrome.alarms.create('gia-long-break', {
      when: Date.now() + minsToMs(longBreakFrequency)
    });
  }
}

// ===== BREAK TRIGGERING =====
async function sendBreak(type, durationMs) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let tab = tabs.find(isEligible);

  if (!tab) {
    const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
    tab = allTabs.find(isEligible);
  }

  if (!tab?.id) return false;

  chrome.tabs.sendMessage(
    tab.id,
    { type: "GIA_SHOW_BREAK", breakType: type, durationMs },
    () => void chrome.runtime.lastError
  );

  return true;
}

// ===== AUDIO =====
async function playBreakAudio(isFirstBreak) {
  const { audioEnabled } = await getSettings();
  if (!audioEnabled) return;

  if (isFirstBreak) {
    // Voice TTS for first break
    await playVoiceGuidance();
  } else {
    // Meditation bell for other breaks
    await playMeditationBell();
  }
}

async function playVoiceGuidance() {
  try {
    const text = "Time for your first break. Every 20 minutes, look 20 feet away for 20 seconds. This helps prevent eye strain and keeps your vision healthy.";
    
    chrome.tts.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    });
  } catch (e) {
    console.warn('TTS failed:', e);
  }
}

async function playMeditationBell() {
  try {
    // Play meditation bell sound
    // Note: You'll need to add a bell.mp3 file to assets/audio/
    const audio = new Audio(chrome.runtime.getURL('assets/audio/bell.mp3'));
    audio.volume = 0.6;
    await audio.play();
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

// ===== AI GENERATION =====
async function generateBreakMessage(locale = "en", tone = "mindful") {
  let text = "Look 20 feet away and soften your gaze.";

  try {
    const { tonePreference } = await getSettings();
    tone = tone || tonePreference;

    // Tone-specific system prompts
    const tonePrompts = {
      mindful: "You create calm, peaceful break reminders focused on mindfulness and relaxation.",
      motivating: "You create energetic, encouraging break reminders that boost motivation.",
      professional: "You create concise, professional break reminders for workplace wellness.",
      friendly: "You create warm, friendly break reminders with a casual, supportive tone."
    };

    const systemPrompt = tonePrompts[tone] || tonePrompts.mindful;

    // 1) Prompt API
    if (chrome?.ai?.prompt) {
      const capabilities = await chrome.ai.prompt.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const session = await chrome.ai.prompt.create({ systemPrompt });
          const result = await session.prompt(
            "Create one sentence (under 90 characters) encouraging a 20-second eye break. No emojis."
          );
          if (result) text = result.trim();
          session.destroy();
        } catch (e) {
          console.warn("Prompt API failed:", e);
        }
      }
    }

    // 2) Writer API (occasionally add wellness tip)
    if (Math.random() < 0.15 && chrome?.ai?.writer) {
      const capabilities = await chrome.ai.writer.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const writer = await chrome.ai.writer.create({
            tone: 'casual',
            length: 'short'
          });
          const tip = await writer.write(
            "Write one actionable tip about eye health or desk ergonomics for computer users. Under 80 characters."
          );
          if (tip) text = tip.trim();
          writer.destroy();
        } catch (e) {
          console.warn("Writer API failed:", e);
        }
      }
    }

    // 3) Rewriter API
    if (chrome?.ai?.rewriter) {
      const capabilities = await chrome.ai.rewriter.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const rewriterTone = tone === 'motivating' ? 'more-formal' : 'more-casual';
          const rewriter = await chrome.ai.rewriter.create({
            tone: rewriterTone,
            length: 'shorter'
          });
          const rewritten = await rewriter.rewrite(text);
          if (rewritten && rewritten.length <= 90) {
            text = rewritten.trim();
          }
          rewriter.destroy();
        } catch (e) {
          console.warn("Rewriter API failed:", e);
        }
      }
    }

    // 4) Translator API
    const lang = (locale || "en").split("-")[0].toLowerCase();
    if (lang !== 'en' && chrome?.ai?.translator) {
      const capabilities = await chrome.ai.translator.capabilities();
      const langPair = capabilities?.languagePairAvailable('en', lang);
      if (langPair === 'readily') {
        try {
          const translator = await chrome.ai.translator.create({
            sourceLanguage: 'en',
            targetLanguage: lang
          });
          const translated = await translator.translate(text);
          if (translated) text = translated.trim();
          translator.destroy();
        } catch (e) {
          console.warn("Translator API failed:", e);
        }
      }
    }

  } catch (e) {
    console.error("AI generation error:", e);
  }

  return text;
}

// ===== ALARM HANDLER =====
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const name = alarm?.name || '';

  // Icon progression stages
  if (name.startsWith('gia-stage-')) {
    const stage = parseInt(name.split('-')[2], 10);
    await setIcon(stage);
    return;
  }

  // Short break
  if (name === 'gia-short-break') {
    const { firstBreakToday, breakCount } = await getSettings();
    
    await setIcon(4); // Final green icon
    await sendBreak('short', SHORT_BREAK_DURATION_MS);
    await playBreakAudio(firstBreakToday);

    // Update break count and first break flag
    await chrome.storage.local.set({
      breakCount: breakCount + 1,
      firstBreakToday: false
    });

    // Schedule reset after break
    chrome.alarms.create('gia-reset', {
      when: Date.now() + SHORT_BREAK_DURATION_MS
    });
    return;
  }

  // Long break
  if (name === 'gia-long-break') {
    const { longBreakDuration } = await getSettings();
    const longMs = minsToMs(longBreakDuration);

    await setIcon(4);
    await sendBreak('long', longMs);
    await playMeditationBell();

    chrome.alarms.create('gia-reset', {
      when: Date.now() + longMs
    });
    return;
  }

  // Snooze end
  if (name === 'gia-snooze-end') {
    await setIcon(4);
    await sendBreak('short', SHORT_BREAK_DURATION_MS);
    await playMeditationBell();

    chrome.alarms.create('gia-reset', {
      when: Date.now() + SHORT_BREAK_DURATION_MS
    });
    return;
  }

  // Reset after break
  if (name === 'gia-reset') {
    await setIcon(0);
    await scheduleAll();
  }
});

// ===== MESSAGE HANDLERS =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  // Reschedule
  if (msg?.type === 'GIA_RESCHEDULE') {
    scheduleAll();
    return;
  }

  // Immediate break
  if (msg?.type === 'GIA_IMMEDIATE_BREAK') {
    (async () => {
      await setIcon(4);
      await sendBreak('short', SHORT_BREAK_DURATION_MS);
      chrome.alarms.create('gia-reset', {
        when: Date.now() + SHORT_BREAK_DURATION_MS
      });
    })();
    return;
  }

  // Snooze
  if (msg?.type === 'GIA_SNOOZE') {
    (async () => {
      const { snoozeDuration } = await getSettings();
      const snoozeMin = msg.minutes || snoozeDuration;
      chrome.alarms.create('gia-snooze-end', {
        when: Date.now() + minsToMs(snoozeMin)
      });
    })();
    return;
  }

  // Pause session
  if (msg?.type === 'GIA_PAUSE') {
    chrome.alarms.clearAll();
    setIcon(0);
    return;
  }

  // Disable for duration
  if (msg?.type === 'GIA_DISABLE_TEMP') {
    (async () => {
      const hours = msg.hours || 1;
      await chrome.alarms.clearAll();
      await setIcon(0);
      
      chrome.alarms.create('gia-resume', {
        when: Date.now() + hours * 60 * 60 * 1000
      });
    })();
    return;
  }

  // Generate AI message
  if (msg?.type === 'GIA_GET_MESSAGE') {
    generateBreakMessage(msg.locale, msg.tone)
      .then(text => sendResponse({ text }))
      .catch(err => {
        console.error('Message generation failed:', err);
        sendResponse({ text: "Look 20 feet away and soften your gaze." });
      });
    return true;
  }
});

// ===== INITIALIZATION =====
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - open onboarding
    await chrome.tabs.create({
      url: chrome.runtime.getURL('ui/onboarding.html')
    });
  } else {
    // Update or reload - start session
    await scheduleAll();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  // Reset first break flag on new day
  const { sessionStartTime } = await chrome.storage.local.get('sessionStartTime');
  const now = Date.now();
  const lastDate = sessionStartTime ? new Date(sessionStartTime).toDateString() : null;
  const today = new Date(now).toDateString();

  if (lastDate !== today) {
    await chrome.storage.local.set({
      breakCount: 0,
      firstBreakToday: true,
      sessionStartTime: now
    });
  }

  await scheduleAll();
});