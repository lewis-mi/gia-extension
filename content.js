// ===== GIA CONTENT SCRIPT =====
// Handles corner logo, break cards, and user interactions

const CORNER_LOGO_ID = "gia-corner-logo";
const BREAK_CARD_ID = "gia-break-card";

let currentStage = 0;
let nextBreakTime = null;
let endTimer = null;
let tickRAF = null;
let currentRecognition = null;
let cornerLogoEnabled = true;

// ===== CORNER LOGO =====
async function createCornerLogo() {
  const { showCornerLogo } = await chrome.storage.local.get('showCornerLogo');
  cornerLogoEnabled = showCornerLogo !== false;
  
  if (!cornerLogoEnabled) return;
  
  // Remove existing
  document.getElementById(CORNER_LOGO_ID)?.remove();

  const container = document.createElement('div');
  container.id = CORNER_LOGO_ID;
  container.className = 'gia-corner-logo stage-0';
  
  // Logo image
  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('assets/logo.png');
  img.alt = 'Gia';
  img.className = 'gia-corner-logo-img';
  
  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'gia-corner-tooltip';
  tooltip.innerHTML = `
    <div class="gia-tooltip-time">Starting session...</div>
    <div class="gia-tooltip-hint">Click for break | Right-click for options</div>
  `;
  
  container.appendChild(img);
  container.appendChild(tooltip);
  
  // Left click - immediate break
  container.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await chrome.runtime.sendMessage({ type: 'GIA_IMMEDIATE_BREAK' });
  });
  
  // Right click - context menu
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY);
  });
  
  // Show tooltip on hover
  container.addEventListener('mouseenter', updateTooltip);
  
  document.body.appendChild(container);
}

function updateCornerLogoStage(stage) {
  if (!cornerLogoEnabled) return;
  
  const logo = document.getElementById(CORNER_LOGO_ID);
  if (!logo) return;
  
  // Remove old stage classes
  logo.className = `gia-corner-logo stage-${stage}`;
  currentStage = stage;
  
  // Add pulse animation at stage 3-4 (15-20 min)
  if (stage >= 3) {
    logo.classList.add('pulse');
  }
}

function updateTooltip() {
  const tooltip = document.querySelector('.gia-corner-tooltip');
  if (!tooltip) return;
  
  const timeEl = tooltip.querySelector('.gia-tooltip-time');
  if (!timeEl) return;
  
  if (nextBreakTime) {
    const remaining = Math.max(0, nextBreakTime - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    timeEl.textContent = `Next break in ${minutes} min`;
  } else {
    timeEl.textContent = 'Break time!';
  }
}

function showContextMenu(x, y) {
  // Remove existing menu
  document.getElementById('gia-context-menu')?.remove();
  
  const menu = document.createElement('div');
  menu.id = 'gia-context-menu';
  menu.className = 'gia-context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  
  const options = [
    { label: 'Pause Session', action: () => chrome.runtime.sendMessage({ type: 'GIA_PAUSE' }) },
    { label: 'Open Settings', action: () => chrome.action.openPopup() },
    { label: 'Disable for 1 hour', action: () => chrome.runtime.sendMessage({ type: 'GIA_DISABLE_TEMP', hours: 1 }) },
    { label: 'Disable for today', action: () => chrome.runtime.sendMessage({ type: 'GIA_DISABLE_TEMP', hours: 24 }) },
    { label: 'Turn off Gia', action: () => chrome.management.setEnabled(chrome.runtime.id, false) }
  ];
  
  options.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'gia-context-item';
    item.textContent = opt.label;
    item.addEventListener('click', () => {
      opt.action();
      menu.remove();
    });
    menu.appendChild(item);
  });
  
  document.body.appendChild(menu);
  
  // Close menu on click outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

// ===== BREAK CARD =====
async function showBreakCard(breakType, durationMs) {
  removeBreakCard();
  
  const wrapper = document.createElement('div');
  wrapper.id = BREAK_CARD_ID;
  wrapper.className = `gia-break-overlay ${breakType}`;
  
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'gia-backdrop';
  backdrop.addEventListener('click', () => dismissBreak(wrapper));
  
  // Card
  const card = document.createElement('div');
  card.className = 'gia-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'gia-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close break reminder');
  closeBtn.addEventListener('click', () => dismissBreak(wrapper));
  
  // Hero (icon + countdown)
  const hero = document.createElement('div');
  hero.className = 'gia-hero';
  
  const heroImg = document.createElement('img');
  heroImg.className = 'gia-hero-img';
  heroImg.src = chrome.runtime.getURL(
    breakType === 'long' 
      ? 'assets/icons/icon_5_green_128.png' 
      : 'assets/icons/icon_5_green_128.png'
  );
  
  const heroCount = document.createElement('span');
  heroCount.className = 'gia-hero-count';
  heroCount.textContent = breakType === 'long' 
    ? `${Math.ceil(durationMs / 60000)}m` 
    : '20s';
  
  hero.appendChild(heroImg);
  hero.appendChild(heroCount);
  
  // Title
  const title = document.createElement('h2');
  title.className = 'gia-title';
  title.textContent = breakType === 'long' 
    ? 'TAKE A LONGER BREAK' 
    : 'TAKE A 20-SECOND BREAK';
  
  // Subtitle
  const subtitle = document.createElement('p');
  subtitle.className = 'gia-subtitle';
  subtitle.textContent = 'EVERY 20 MINUTES';
  
  // AI-generated instruction
  const instruction = document.createElement('p');
  instruction.className = 'gia-instruction';
  instruction.textContent = 'Loading...';
  
  // Fetch AI message
  const message = await fetchAIMessage();
  instruction.textContent = message;
  
  // Voice command section
  const voiceSection = await createVoiceSection(wrapper);
  
  // Snooze button (for short breaks)
  let snoozeBtn = null;
  if (breakType === 'short') {
    snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'gia-snooze-btn';
    snoozeBtn.textContent = 'Snooze 5 min';
    snoozeBtn.addEventListener('click', async () => {
      const { snoozeDuration } = await chrome.storage.local.get('snoozeDuration');
      await chrome.runtime.sendMessage({ type: 'GIA_SNOOZE', minutes: snoozeDuration || 5 });
      dismissBreak(wrapper);
    });
  }
  
  // Hint
  const hint = document.createElement('p');
  hint.className = 'gia-hint';
  hint.textContent = 'Press ESC or click outside to close';
  
  // Assemble card
  card.appendChild(closeBtn);
  card.appendChild(hero);
  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(instruction);
  if (voiceSection) card.appendChild(voiceSection);
  if (snoozeBtn) card.appendChild(snoozeBtn);
  card.appendChild(hint);
  
  wrapper.appendChild(backdrop);
  wrapper.appendChild(card);
  document.body.appendChild(wrapper);
  
  // Animate in
  requestAnimationFrame(() => {
    card.classList.add('enter');
  });
  
  // Start countdown
  startCountdown(heroCount, durationMs);
  
  // Auto-dismiss
  endTimer = setTimeout(() => dismissBreak(wrapper), durationMs);
  
  // ESC to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      dismissBreak(wrapper);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function dismissBreak(wrapper) {
  const card = wrapper.querySelector('.gia-card');
  if (card) {
    card.classList.remove('enter');
    card.classList.add('exit');
  }
  
  setTimeout(() => removeBreakCard(), 320);
}

function removeBreakCard() {
  clearTimeout(endTimer);
  if (tickRAF) cancelAnimationFrame(tickRAF);
  tickRAF = null;
  
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch (e) {}
    currentRecognition = null;
  }
  
  document.getElementById(BREAK_CARD_ID)?.remove();
}

function startCountdown(element, durationMs) {
  const start = Date.now();
  const isLong = durationMs > 60000;
  
  const tick = () => {
    const remaining = Math.max(0, durationMs - (Date.now() - start));
    
    if (isLong) {
      const mins = Math.ceil(remaining / 60000);
      element.textContent = `${mins}m`;
    } else {
      const secs = Math.ceil(remaining / 1000);
      element.textContent = `${secs}s`;
    }
    
    if (remaining > 0) {
      tickRAF = requestAnimationFrame(tick);
    }
  };
  
  tick();
}

async function fetchAIMessage() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GIA_GET_MESSAGE',
      locale: navigator.language
    });
    return response?.text || "Look 20 feet away and soften your gaze.";
  } catch (e) {
    console.warn('Failed to fetch AI message:', e);
    return "Look 20 feet away and soften your gaze.";
  }
}

async function createVoiceSection(wrapper) {
  const { voiceEnabled } = await chrome.storage.local.get('voiceEnabled');
  if (!voiceEnabled) return null;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  
  const voiceSection = document.createElement('div');
  voiceSection.className = 'gia-voice';
  
  const micBtn = document.createElement('button');
  micBtn.className = 'gia-mic';
  micBtn.textContent = '🎤 Voice Command';
  
  const micStatus = document.createElement('span');
  micStatus.className = 'gia-mic-status';
  micStatus.hidden = true;
  
  const rec = new SpeechRecognition();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  
  currentRecognition = rec;
  let listening = false;
  
  micBtn.addEventListener('click', () => {
    if (listening) {
      try { rec.stop(); } catch (e) {}
      return;
    }
    
    try {
      listening = true;
      micStatus.hidden = false;
      micStatus.textContent = 'Listening...';
      rec.start();
    } catch (e) {
      console.error('Speech recognition failed:', e);
      micStatus.textContent = 'Error';
      listening = false;
    }
  });
  
  rec.onresult = async (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    console.log('Voice command:', text);
    
    micStatus.textContent = `Heard: "${text}"`;
    
    const intent = await classifyIntent(text);
    console.log('Intent:', intent);
    
    if (intent === 'dismiss') {
      dismissBreak(wrapper);
    } else if (intent === 'snooze') {
      const { snoozeDuration } = await chrome.storage.local.get('snoozeDuration');
      await chrome.runtime.sendMessage({ 
        type: 'GIA_SNOOZE', 
        minutes: snoozeDuration || 5 
      });
      micStatus.textContent = `Snoozed for ${snoozeDuration || 5} min`;
      setTimeout(() => dismissBreak(wrapper), 1000);
    }
  };
  
  const resetUI = () => {
    listening = false;
    micStatus.hidden = true;
    currentRecognition = null;
  };
  
  rec.onend = resetUI;
  rec.onerror = (e) => {
    console.error('Speech error:', e.error);
    if (e.error === 'no-speech') {
      micStatus.textContent = 'No speech detected';
    } else if (e.error === 'not-allowed') {
      micStatus.textContent = 'Microphone permission denied';
    } else {
      micStatus.textContent = `Error: ${e.error}`;
    }
    setTimeout(resetUI, 2000);
  };
  
  voiceSection.appendChild(micBtn);
  voiceSection.appendChild(micStatus);
  
  return voiceSection;
}

// Basic intent classification with fallback
function basicIntent(text) {
  const t = (text || '').toLowerCase();
  if (/\b(dismiss|close|stop|cancel|end)\b/.test(t)) return 'dismiss';
  if (/\b(snooze|later|remind me|wait)\b/.test(t)) return 'snooze';
  return 'start';
}

// AI-powered intent classification using Prompt API
async function classifyIntent(text) {
  try {
    if (!chrome?.ai?.prompt) return basicIntent(text);
    
    const capabilities = await chrome.ai.prompt.capabilities();
    if (capabilities?.available !== 'readily') return basicIntent(text);
    
    const session = await chrome.ai.prompt.create({
      systemPrompt: "You classify user voice commands into exactly one intent: start, snooze, or dismiss."
    });
    
    const result = await session.prompt(
      `Classify this phrase into one of: start, snooze, dismiss\nPhrase: "${text}"\nAnswer with just one word.`
    );
    
    session.destroy();
    
    const out = (result || '').toLowerCase().trim();
    if (/snooze/.test(out)) return 'snooze';
    if (/dismiss/.test(out)) return 'dismiss';
    return 'start';
  } catch (e) {
    console.warn('Intent classification failed:', e);
    return basicIntent(text);
  }
}

// ===== MESSAGE LISTENERS =====
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'GIA_SHOW_BREAK') {
    showBreakCard(msg.breakType, msg.durationMs);
  }
  
  if (msg?.type === 'GIA_UPDATE_STAGE') {
    updateCornerLogoStage(msg.stage);
    nextBreakTime = msg.nextBreakTime;
    updateTooltip();
  }
  
  if (msg?.type === 'GIA_TOGGLE_CORNER') {
    cornerLogoEnabled = msg.enabled;
    if (cornerLogoEnabled) {
      createCornerLogo();
    } else {
      document.getElementById(CORNER_LOGO_ID)?.remove();
    }
  }
});

// ===== INITIALIZATION =====
(async function init() {
  // Wait a bit for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCornerLogo);
  } else {
    await createCornerLogo();
  }
  
  // Update tooltip every 30 seconds
  setInterval(updateTooltip, 30000);
})();