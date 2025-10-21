// ===== CONFIG =====
const DEFAULT_INTERVAL_MIN = 20;          // 20-20-20 short break cadence
const BREAK_DURATION_MS   = 20_000;       // 20s card
const ICONS = [
  {16:"assets/icons/icon_0_start.png", 32:"assets/icons/icon_0_start_32.png"},
  {16:"assets/icons/icon_1_step.png",  32:"assets/icons/icon_1_step_32.png"},
  {16:"assets/icons/icon_2_step.png",  32:"assets/icons/icon_2_step_32.png"},
  {16:"assets/icons/icon_3_step.png",  32:"assets/icons/icon_3_step_32.png"},
  {16:"assets/icons/icon_4_break.png", 32:"assets/icons/icon_4_break_32.png"}
];

// ===== HELPERS =====
function minsToMs(m){ return m * 60 * 1000; }
function isEligible(tab){ return /^https?:\/\//.test(tab?.url || ""); }
async function setIcon(idx){ await chrome.action.setIcon({ path: ICONS[idx] }); }

async function sendBreak(kind, durationMs) {
  let [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  if(!isEligible(tab)){
    const tabs = await chrome.tabs.query({ lastFocusedWindow:true });
    tab = tabs.find(isEligible);
  }
  if(!tab?.id) return false;
  chrome.tabs.sendMessage(tab.id, { type:"GIA_SHOW_BREAK", kind, durationMs }, () => void chrome.runtime.lastError);
  return true;
}

async function getSettings() {
  const {
    voiceEnabled = false,
    asrEnabled = false,
    sessionMinutes = 60,
    shortEnabled = true,
    longEnabled = true,
    longBreakMinutes = 10
  } = await chrome.storage.local.get(['voiceEnabled','asrEnabled','sessionMinutes','shortEnabled','longEnabled','longBreakMinutes']);
  return { voiceEnabled, asrEnabled, sessionMinutes, shortEnabled, longEnabled, longBreakMinutes };
}

// ===== SCHEDULING =====
async function scheduleAll() {
  await chrome.alarms.clearAll();

  const { sessionMinutes, shortEnabled, longEnabled, longBreakMinutes } = await getSettings();

  // Always reset icon to blue at start of cycle
  await setIcon(0);

  // Short-break (20-20-20) cycle
  if (shortEnabled) {
    const stepMs = minsToMs(DEFAULT_INTERVAL_MIN) / 4; // 4 steps → then break
    for (let i=1; i<=4; i++) {
      chrome.alarms.create(`gia-step-${i}`, { when: Date.now() + stepMs * i });
    }
  }

  // Long break at session end
  if (longEnabled) {
    chrome.alarms.create('gia-session-end', { when: Date.now() + minsToMs(sessionMinutes) });
  }
}

// ===== EVENTS =====
chrome.runtime.onInstalled.addListener(scheduleAll);
chrome.runtime.onStartup.addListener(scheduleAll);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'GIA_RESCHEDULE') scheduleAll();
});

// Click icon → immediate short break
chrome.action.onClicked.addListener(async () => {
  await setIcon(4);
  await sendBreak('short', BREAK_DURATION_MS);
  chrome.alarms.create('gia-reset', { when: Date.now() + BREAK_DURATION_MS });
});

// Alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const name = alarm?.name || '';

  // Icon steps + short break
  if (name.startsWith('gia-step-')) {
    const i = parseInt(name.split('-')[2], 10); // 1..4
    if (i < 4) {
      await setIcon(i);
    } else {
      await setIcon(4);
      await sendBreak('short', BREAK_DURATION_MS);
      chrome.alarms.create('gia-reset', { when: Date.now() + BREAK_DURATION_MS });
    }
    return;
  }

  // Long break at session end
  if (name === 'gia-session-end') {
    const { longBreakMinutes } = await getSettings();
    const longMs = minsToMs(longBreakMinutes);
    await setIcon(4);
    await sendBreak('long', longMs);
    chrome.alarms.create('gia-reset', { when: Date.now() + longMs });
    return;
  }

  // Reset after any break (short or long)
  if (name === 'gia-reset') {
    await setIcon(0);
    scheduleAll();  // new cycle & session timer
  }
});
// ==== AI: Prompt -> (Rewriter trial) -> Translator; runs in extension context ====

async function getMindfulLineFromAI(locale = "en") {
  let text = "Look 20 feet away and soften your gaze."; // fallback

  try {
    // 1) Prompt API (stable in 138)
    if (chrome?.ai?.prompt?.generate) {
      const res = await chrome.ai.prompt.generate({
        model: "gemini-nano",
        input: "Return one calm sentence (<= 90 chars) encouraging a 20-second eye break. No emojis."
      });
      const out = res?.output?.text || res?.text;
      if (out) text = out.trim();
    }

    // 2) Rewriter API (trial; enabled by manifest `trial_tokens`)
    if (chrome?.ai?.rewriter?.rewrite) {
      const r = await chrome.ai.rewriter.rewrite({
        text,
        style: "mindful_minimal",
        constraints: { maxChars: 90 }
      });
      const rout = r?.output?.text || r?.text;
      if (rout) text = rout.trim();
    }

    // 3) Translator API (stable)
    const lang = (locale || "en").split("-")[0];
    if (!lang.startsWith("en") && chrome?.ai?.translator?.translate) {
      const t = await chrome.ai.translator.translate({ text, to: lang });
      const tout = t?.output?.text || t?.text;
      if (tout) text = tout.trim();
    }
  } catch (e) {
    console.warn("Gia AI (background) failed; using fallback:", e);
  }

  return text;
}

// Handle requests from content.js
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GIA_GET_MINDFUL_LINE") {
    (async () => {
      const text = await getMindfulLineFromAI(msg.locale || "en");
      sendResponse({ text });
    })();
    return true; // keep message channel open for async response
  }
});
