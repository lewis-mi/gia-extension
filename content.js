// ===== GIA CONTENT SCRIPT =====
// Handles corner logo, break cards, and user interactions

console.log('GIA content script loaded!');

const CORNER_LOGO_ID = "gia-corner-logo";
const BREAK_CARD_ID = "gia-break-card";

let endTimer = null;
let tickRAF = null;
let currentRecognition = null;

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
  img.src = chrome.runtime.getURL('assets/logo.svg');
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
async function showBreakCard(breakType, durationMs, toneOverride = null) {
  console.log('showBreakCard called with:', breakType, durationMs, 'toneOverride:', toneOverride);
  console.log('Document body:', document.body);
  console.log('Document readyState:', document.readyState);
  
  // If document isn't ready, wait for it
  if (document.readyState === 'loading') {
    console.log('Waiting for DOM to load...');
    await new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
  
  removeBreakCard();
  
  const wrapper = document.createElement('div');
  wrapper.id = BREAK_CARD_ID;
  wrapper.className = `gia-break-overlay ${breakType}`;
  console.log('Created wrapper:', wrapper);
  
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
  heroImg.src = chrome.runtime.getURL('assets/logo.svg');
  
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
  
  // Subtitle (only for short breaks)
  const subtitle = document.createElement('p');
  subtitle.className = 'gia-subtitle';
  subtitle.textContent = breakType === 'long' ? '' : 'EVERY 20 MINUTES';
  
  // AI-generated instruction
  const instruction = document.createElement('p');
  instruction.className = 'gia-instruction';
  instruction.textContent = 'Loading...';
  
  // Multimodal interaction section
  const multimodalSection = await createMultimodalSection(wrapper);
  
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
  if (multimodalSection) card.appendChild(multimodalSection);
  card.appendChild(hint);
  
  wrapper.appendChild(backdrop);
  wrapper.appendChild(card);
  document.body.appendChild(wrapper);
  
  // Animate in
  requestAnimationFrame(() => {
    card.classList.add('enter');
  });
  
  // Fetch AI message and start audio immediately
  const messagePromise = fetchAIMessage(breakType, toneOverride);
  
  // Start TTS as soon as message is ready
  messagePromise.then(async (message) => {
    instruction.textContent = message;
    
    // Check audio settings
    const { settings = {} } = await chrome.storage.local.get('settings');
    console.log('Audio enabled?', settings.audioEnabled);
    
    // Start TTS via background script if audio is enabled
    if (settings.audioEnabled !== false) {
      try {
        // Get tone to adjust voice parameters (use override if in demo)
        const { settings = {} } = await chrome.storage.local.get('settings');
        const tone = toneOverride || settings?.tipTone || 'mindful';
        
        // Tone-specific audio profiles with refined characteristics
        const toneProfiles = {
          mindful: { rate: 0.9, pitch: 0.9, volume: 0.85 },
          goofy: { rate: 1.0, pitch: 1.1, volume: 0.95 }
        };
        
        let rate, pitch, volume;
        if (breakType === 'long') {
          rate = 0.75;
          pitch = 0.85;
          volume = 0.9;
        } else {
          // Use tone-specific profile
          const profile = toneProfiles[tone] || toneProfiles.mindful;
          rate = profile.rate;
          pitch = profile.pitch;
          volume = profile.volume;
        }
        
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'GIA_SPEAK',
            text: message,
            rate: rate,
            pitch: pitch,
            volume: volume,
            tone: tone
          });
          
          // If we got audio data back, play it
          if (response?.audioData) {
            const blob = new Blob([response.audioData], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
            console.log('Playing high-quality AI audio');
          } else {
            console.log('TTS started for break card with message:', message);
          }
        } catch (e) {
          console.error('TTS error:', e);
        }
      } catch (e) {
        console.error('TTS error:', e);
      }
    } else {
      console.log('Audio disabled, skipping TTS');
    }
  });
  
  // Start countdown
  startCountdown(heroCount, durationMs);
  
  // Auto-dismiss without reflection prompt
  let dismissed = false;
  endTimer = setTimeout(() => {
    if (!dismissed) {
      dismissed = true;
      dismissBreak(wrapper);
    }
  }, durationMs);
  
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
  let completeAnnounced = false;
  let lastRemaining = durationMs;
  
  // Clear any existing interval first
  if (tickRAF) {
    clearInterval(tickRAF);
    tickRAF = null;
  }
  
  // Use setInterval to update every 1 second instead of every frame
  const interval = setInterval(() => {
    const remaining = Math.max(0, durationMs - (Date.now() - start));
    
    if (isLong) {
      const mins = Math.ceil(remaining / 60000);
      element.textContent = `${mins}m`;
    } else {
      const secs = Math.ceil(remaining / 1000);
      element.textContent = `${secs}s`;
    }
    
    // Play ping sound and cleanup when countdown reaches zero (only once)
    // Check if we just crossed from >0 to 0
    if (remaining === 0 && lastRemaining > 0 && !completeAnnounced) {
      completeAnnounced = true;
      clearInterval(interval);
      
      if (!isLong) {
        try {
          chrome.runtime.sendMessage({
            type: 'GIA_SPEAK',
            text: 'Break complete',
            rate: 1.0,
            pitch: 1.0,
            volume: 0.7
          });
          console.log('Break complete notification sent');
        } catch (e) {
          console.log('Break complete notification failed:', e);
        }
      }
    }
    
    lastRemaining = remaining;
  }, 1000); // Update every 1 second
  
  // Store interval ID to cleanup on dismiss
  tickRAF = interval;
}

async function fetchAIMessage(breakType = 'short', tone = null) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GIA_GET_MESSAGE',
      locale: navigator.language,
      breakType: breakType,
      tone: tone
    });
    return response?.text || "Look 20 feet away and soften your gaze.";
  } catch (e) {
    console.warn('Failed to fetch AI message:', e);
    return "Look 20 feet away and soften your gaze.";
  }
}

async function createMultimodalSection(wrapper) {
  const result = await chrome.storage.local.get(['voiceEnabled', 'multimodalEnabled', 'settings']);
  const voiceEnabled = result.voiceEnabled || result.settings?.voiceCommandsEnabled || false;
  const multimodalEnabled = result.multimodalEnabled !== false;
  if (!multimodalEnabled) return null;
  
  const multimodalSection = document.createElement('div');
  multimodalSection.className = 'gia-multimodal';
  
  // Voice input
  if (voiceEnabled) {
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'gia-multimodal-btn';
    voiceBtn.textContent = '🎤 Voice';
    voiceBtn.title = 'Speak your command';
    
    voiceBtn.addEventListener('click', () => startVoiceInput(wrapper, multimodalSection));
    multimodalSection.appendChild(voiceBtn);
  }
  
  // Image input for screen analysis
  const imageBtn = document.createElement('button');
  imageBtn.className = 'gia-multimodal-btn';
  imageBtn.textContent = 'Remind me in 5 minutes';
  imageBtn.title = 'Remind me in 5 minutes';
  
  imageBtn.addEventListener('click', () => {
    dismissBreak(wrapper);
    // Could add snooze logic here if needed
  });
  multimodalSection.appendChild(imageBtn);
  
  // Status display
  const status = document.createElement('div');
  status.className = 'gia-multimodal-status';
  status.hidden = true;
  multimodalSection.appendChild(status);
  
  return multimodalSection;
}

async function startVoiceInput(wrapper, container) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  
  const status = container.querySelector('.gia-multimodal-status');
  status.hidden = false;
  status.textContent = 'Listening...';
  
  const rec = new SpeechRecognition();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  
  currentRecognition = rec;
  
  try {
    rec.start();
  } catch (e) {
    status.textContent = 'Voice input unavailable';
    return;
  }
  
  rec.onresult = async (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    status.textContent = `Processing: "${text}"`;
    
    // Use AI to analyze voice command with multimodal context
    const response = await chrome.runtime.sendMessage({
      type: 'GIA_MULTIMODAL_PROCESS',
      audio: text,
      context: 'break_interaction'
    });
    
    if (response?.action === 'dismiss') {
      dismissBreak(wrapper);
    } else if (response?.action === 'snooze') {
      await chrome.runtime.sendMessage({ 
        type: 'GIA_SNOOZE', 
        minutes: response.duration || 5 
      });
      status.textContent = `Snoozed for ${response.duration || 5} min`;
      setTimeout(() => dismissBreak(wrapper), 1000);
    } else {
      status.textContent = response?.message || 'Command processed';
    }
  };
  
  rec.onerror = (e) => {
    status.textContent = 'Voice input failed';
    setTimeout(() => status.hidden = true, 2000);
  };
}

async function analyzeScreen(wrapper, container) {
  // This function is deprecated - replaced by "Remind me later" button
  // Keeping for backwards compatibility but not called anymore
  console.log('analyzeScreen called but deprecated');
  dismissBreak(wrapper);
}

// Removed showReflectionPrompt - no longer used

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
  console.log('Content script received message:', msg);
  if (msg?.type === 'GIA_SHOW_BREAK') {
    console.log('Showing break card with type:', msg.breakType, 'duration:', msg.durationMs, 'tone:', msg.tone);
    showBreakCard(msg.breakType, msg.durationMs, msg.tone);
  }
  
  if (msg?.type === 'GIA_UPDATE_STAGE') {
    updateCornerLogoStage(msg.stage);
    nextBreakTime = msg.nextBreakTime;
    updateTooltip();
  }
  
});

// Test function to manually trigger break card
window.testGiaBreakCard = function() {
  console.log('Test function called!');
  showBreakCard('short', 20000);
};

// ===== INITIALIZATION =====
// Auto-trigger demo if on demo page
(async function init() {
  // Check if we're on the demo page
  if (window.location.pathname.includes('demo.html')) {
    console.log('Demo page detected! Triggering demo sequence...');
    
    // Wait a moment for page to fully load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger demo breaks
    try {
      // Get the tab ID and trigger break sequence
      chrome.runtime.sendMessage({
        type: 'GIA_START_DEMO',
        tabId: window.location.href
      });
      
      console.log('Demo message sent to background');
    } catch (e) {
      console.log('Could not trigger demo automatically:', e);
    }
  }
})();