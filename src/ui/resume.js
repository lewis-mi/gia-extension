// ===== GIA RESUME SESSION =====
// Resume paused sessions with progress summary

const totalBreaksEl = document.getElementById('totalBreaks');
const streakEl = document.getElementById('streak');
const lastActivityEl = document.getElementById('lastActivity');
const resumeBtn = document.getElementById('resume');
const restartBtn = document.getElementById('restart');

async function init() {
  await loadStats();
  
  resumeBtn.addEventListener('click', async () => {
    // Resume the session by scheduling all alarms
    await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
    window.close();
  });
  
  restartBtn.addEventListener('click', async () => {
    // Restart fresh - clear old data and start new session
    await chrome.storage.local.set({
      breakCount: 0,
      sessionStartTime: Date.now(),
      firstBreakToday: true
    });
    await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
    window.close();
  });
}

async function loadStats() {
  try {
    const { 
      breakCount = 0,
      sessionStartTime = null,
      reflections = []
    } = await chrome.storage.local.get([
      'breakCount', 
      'sessionStartTime',
      'reflections'
    ]);
    
    totalBreaksEl.textContent = breakCount;
    
    // Calculate streak
    const streak = await calculateStreak();
    streakEl.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    
    // Last activity
    if (sessionStartTime) {
      const date = new Date(sessionStartTime);
      const now = Date.now();
      const diffMinutes = Math.floor((now - date) / 60000);
      
      if (diffMinutes < 60) {
        lastActivityEl.textContent = `${diffMinutes}m ago`;
      } else if (diffMinutes < 1440) {
        lastActivityEl.textContent = `${Math.floor(diffMinutes / 60)}h ago`;
      } else {
        lastActivityEl.textContent = date.toLocaleDateString();
      }
    }
    
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

async function calculateStreak() {
  // Get streak from storage or calculate from break history
  const { streak = 0 } = await chrome.storage.local.get('streak');
  return streak;
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

