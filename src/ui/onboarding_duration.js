// ===== GIA ONBOARDING SCREEN 3: DURATION + LONG BREAKS =====

let hasCompleted = false;

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return settings;
}

async function setSettings(patch) {
  const s = await getSettings();
  const n = { ...s, ...patch };
  await chrome.storage.local.set({ settings: n });
  return n;
}

async function init() {
  const completeBtn = document.getElementById('completeBtn');
  const backBtn = document.getElementById('backBtn');
  const longBreaksToggle = document.getElementById('longBreaksToggle');
  const durationControls = document.getElementById('durationControls');
  const endTimeInput = document.getElementById('endTime');
  const breakLengthSelect = document.getElementById('breakLength');
  const breakFrequencySelect = document.getElementById('breakFrequency');
  
  // Toggle for longer breaks
  if (longBreaksToggle) {
    longBreaksToggle.addEventListener('click', () => {
      const switch_ = longBreaksToggle.querySelector('.toggle-switch');
      const isActive = switch_.classList.contains('active');
      switch_.classList.toggle('active');
      
      // Show/hide duration controls
      if (!isActive) {
        durationControls.classList.remove('hidden');
      } else {
        durationControls.classList.add('hidden');
      }
    });
  }
  
  // Back button - go to previous step
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const tonePageUrl = chrome.runtime.getURL('src/ui/onboarding_tone.html');
      window.location.href = tonePageUrl;
    });
  }
  
  // Complete onboarding
  if (completeBtn) {
    completeBtn.addEventListener('click', async () => {
      if (hasCompleted) return;
      hasCompleted = true;
      
      // Gather settings
      const longBreaksEnabled = longBreaksToggle.querySelector('.toggle-switch').classList.contains('active');
      const endTime = endTimeInput.value;
      const breakLength = breakLengthSelect.value;
      const breakFrequency = breakFrequencySelect.value;
      
      // Save settings
      await setSettings({
        longEnabled: longBreaksEnabled,
        endTime: endTime,
        longBreakLength: parseInt(breakLength),
        longBreakFrequency: parseInt(breakFrequency)
      });
      
      // Mark onboarding as complete
      await chrome.storage.local.set({ onboardingComplete: true });
      
      // Start the session
      try {
        await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
      } catch (e) {
        console.warn('Could not send reschedule message:', e);
      }
      
      // Close the tab
      window.close();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

