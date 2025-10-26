// ===== GIA LONG BREAK =====
// Dedicated page for longer breaks with suggested activities

const countdownEl = document.getElementById('countdown');
const skipBtn = document.getElementById('skip');
const extendBtn = document.getElementById('extend');
const aiMessageEl = document.getElementById('aiMessage');
const activitiesEl = document.getElementById('activities');

let breakDuration = 10; // minutes
let breakTimer = null;

async function init() {
  // Get break duration from settings
  const { longBreakDuration = 10 } = await chrome.storage.local.get('longBreakDuration');
  breakDuration = longBreakDuration;
  
  // Fetch AI-generated message
  await loadAIMessage();
  
  // Start countdown
  startCountdown();
  
  // Setup event listeners
  skipBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GIA_RESET' });
    window.close();
  });
  
  extendBtn.addEventListener('click', async () => {
    breakDuration += 5;
    startCountdown();
  });
}

async function loadAIMessage() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GIA_GET_MESSAGE',
      locale: navigator.language
    });
    
    if (response?.text) {
      aiMessageEl.textContent = response.text;
    }
  } catch (e) {
    console.warn('Failed to load AI message:', e);
  }
}

function startCountdown() {
  if (breakTimer) clearInterval(breakTimer);
  
  const startTime = Date.now();
  const durationMs = breakDuration * 60 * 1000;
  
  const update = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, durationMs - elapsed);
    
    if (remaining <= 0) {
      countdownEl.textContent = 'Break Complete!';
      clearInterval(breakTimer);
      
      // Show completion message
      setTimeout(() => {
        aiMessageEl.textContent = 'Great job! Your eyes and mind are refreshed. Ready to focus again?';
        
        // Close after 5 seconds
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'GIA_RESET' });
          window.close();
        }, 5000);
      }, 1000);
    } else {
      const minutes = Math.ceil(remaining / 60000);
      countdownEl.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  update();
  breakTimer = setInterval(update, 1000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

