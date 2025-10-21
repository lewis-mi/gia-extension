// content.js — Gia break card controller (Option B: AI in background)

const CARD_ID = "gia-break-card";
const DEFAULT_BREAK_MS = 20_000; // 20s

let endTimer = null;
let tickRAF = null;

function injectStylesheet() {
  if (document.getElementById("gia-card-css")) return;
  const href = chrome.runtime.getURL("styles/card.css");
  const link = Object.assign(document.createElement("link"), {
    id: "gia-card-css",
    rel: "stylesheet",
    href
  });
  document.documentElement.appendChild(link);
}
async function loadVoiceSetting() {
  const { voiceEnabled = false } = await chrome.storage.local.get('voiceEnabled');
  return !!voiceEnabled;
}

function basicIntent(text) {
  const t = (text || '').toLowerCase();
  if (/\bdismiss|close|stop\b/.test(t)) return 'dismiss';
  if (/\bsnooze|later|remind me\b/.test(t)) return 'snooze';
  // default
  if (/\bstart|begin|okay|ok|go\b/.test(t)) return 'start';
  return 'start';
}

async function classifyIntentWithPrompt(text) {
  try {
    if (!chrome?.ai?.prompt?.generate) return basicIntent(text);
    const res = await chrome.ai.prompt.generate({
      model: "gemini-nano",
      input: `Classify the user's phrase into exactly one of: start, snooze, dismiss.\nPhrase: "${text}"\nAnswer with just the label.`
    });
    const out = (res?.output?.text || res?.text || '').toLowerCase().trim();
    return /snooze/.test(out) ? 'snooze' : /dismiss/.test(out) ? 'dismiss' : 'start';
  } catch { return basicIntent(text); }
}

function removeCard() {
  clearTimeout(endTimer);
  if (tickRAF) cancelAnimationFrame(tickRAF);
  tickRAF = null;
  document.getElementById(CARD_ID)?.remove();
}

function startCountdownIfPresent(root, durationMs) {
  const countEl = root.querySelector(".gia-hero-count");
  if (!countEl) return;
  const start = Date.now();
  const tick = () => {
    const left = Math.max(0, durationMs - (Date.now() - start));
    const secs = Math.ceil(left / 1000);
    countEl.textContent = `${secs}s`;
    if (left > 0) tickRAF = requestAnimationFrame(tick);
  };
  tick();
}

async function fetchMindfulLine() {
  try {
    const res = await chrome.runtime.sendMessage({ type: "GIA_GET_MINDFUL_LINE", locale: navigator.language });
    return res?.text || "Look 20 feet away and soften your gaze.";
  } catch (e) {
    console.warn("Gia: AI line fallback", e);
    return "Look 20 feet away and soften your gaze.";
  }
}

function setHeroIfPresent(wrapper) {
  const img = wrapper.querySelector(".gia-hero-img");
  if (!img) return;
  const p128 = chrome.runtime.getURL("assets/icons/icon_4_break_128.png");
  const p32  = chrome.runtime.getURL("assets/icons/icon_4_break_32.png");
  img.src = p128; img.onerror = () => (img.src = p32);
}

function wireDismiss(wrapper, root) {
  wrapper.querySelector(".gia-backdrop")?.addEventListener("click", () => {
    root.classList.add("exit"); setTimeout(removeCard, 320);
  });
  wrapper.querySelector(".gia-close")?.addEventListener("click", () => {
    root.classList.add("exit"); setTimeout(removeCard, 320);
  });
  const keyHandler = (e) => {
    if (e.key === "Escape") { root.classList.add("exit"); setTimeout(removeCard, 320); }
  };
  document.addEventListener("keydown", keyHandler, { once: true });
}

async function showCard(kind = "short", durationMs = DEFAULT_BREAK_MS) {
  removeCard();
  injectStylesheet();

  const html = await fetch(chrome.runtime.getURL("ui/reminder.html")).then(r => r.text());
  const wrapper = document.createElement("div");
  wrapper.id = CARD_ID;
  wrapper.innerHTML = html;
  document.documentElement.appendChild(wrapper);
const useVoice = await loadVoiceSetting();
const micBtn = wrapper.querySelector(".gia-mic");
const micStatus = wrapper.querySelector(".gia-mic-status");

if (useVoice && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && micBtn && micStatus) {
  micBtn.hidden = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let listening = false;

  micBtn.addEventListener('click', () => {
    if (listening) { rec.stop(); return; }
    try {
      listening = true;
      micStatus.hidden = false;
      micStatus.textContent = "Listening…";
      rec.start();
    } catch {}
  });

  rec.onresult = async (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    const intent = await classifyIntentWithPrompt(text); // uses Prompt if available, else rules
    if (intent === 'dismiss') {
      root.classList.add("exit"); setTimeout(removeCard, 320);
    } else if (intent === 'snooze') {
      chrome.runtime.sendMessage({ type: 'GIA_SNOOZE', minutes: 5 });
      root.classList.add("exit"); setTimeout(removeCard, 320);
    } // 'start' keeps the current break
  };

  const resetUI = () => { listening = false; micStatus.hidden = true; };
  rec.onend = resetUI;
  rec.onerror = resetUI;
}

  const root = wrapper.querySelector(".gia-card");
  root?.classList.add("enter");

  setHeroIfPresent(wrapper);

  const titleEl = wrapper.querySelector(".gia-title");
  if (titleEl) titleEl.textContent = (kind === "long") ? "TAKE A LONGER BREAK" : "TAKE A 20-SECOND BREAK";

  // 🔹 Ask background (service worker) for an AI-generated mindful line
  const lineEl = wrapper.querySelector(".gia-instruction");
  if (lineEl) lineEl.textContent = await fetchMindfulLine();

  wireDismiss(wrapper, root);
  startCountdownIfPresent(root, durationMs);

  endTimer = setTimeout(() => {
    root?.classList.add("exit");
    setTimeout(removeCard, 320);
  }, durationMs);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "GIA_SHOW_BREAK") {
    showCard(msg.kind, msg.durationMs);
  }
});

