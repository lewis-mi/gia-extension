// ===== GIA ONBOARDING SCREEN 1: SETUP =====

async function init() {
  const demoBtn = document.getElementById('demoBtn');
  const continueBtn = document.getElementById('continueBtn');
  const audioToggle = document.getElementById('audioToggle');
  const voiceCommandsToggle = document.getElementById('voiceCommandsToggle');
  const languageSelect = document.getElementById('languageSelect');
  
  // Demo mode - skip onboarding and start immediately
  if (demoBtn) {
    demoBtn.addEventListener('click', async () => {
      // Set demo settings
      await chrome.storage.local.set({
        'settings.audioEnabled': true,
        'settings.voiceCommandsEnabled': false,
        'settings.language': 'auto',
        'settings.tipTone': 'mindful',
        'settings.longEnabled': true,
        'settings.endTime': '18:00',
        'settings.longBreakLength': 5,
        'settings.longBreakFrequency': 60,
        'settings.phoneHapticsEnabled': false
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
  
  // Toggle functionality
  function setupToggle(element, callback) {
    element.addEventListener('click', () => {
      const switch_ = element.querySelector('.toggle-switch');
      const isActive = switch_.classList.contains('active');
      switch_.classList.toggle('active');
      callback(!isActive);
    });
  }
  
  // Initialize toggles
  setupToggle(audioToggle, async (enabled) => {
    await chrome.storage.local.set({ 'settings.audioEnabled': enabled });
  });
  
  setupToggle(voiceCommandsToggle, async (enabled) => {
    await chrome.storage.local.set({ 'settings.voiceCommandsEnabled': enabled });
  });
  
  // Language selector
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
      await chrome.storage.local.set({ 'settings.language': e.target.value });
    });
  }
  
  // Continue to next screen
  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      // Save initial settings
      const audioEnabled = audioToggle.querySelector('.toggle-switch').classList.contains('active');
      const voiceEnabled = voiceCommandsToggle.querySelector('.toggle-switch').classList.contains('active');
      const language = languageSelect.value;
      
      await chrome.storage.local.set({
        'settings.audioEnabled': audioEnabled,
        'settings.voiceCommandsEnabled': voiceEnabled,
        'settings.language': language
      });
      
      // Navigate to tone selection screen
      const tonePageUrl = chrome.runtime.getURL('ui/onboarding_tone.html');
      window.location.href = tonePageUrl;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
