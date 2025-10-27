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
      try {
        // Set demo settings in the correct structure
        await chrome.storage.local.set({
          settings: {
            audioEnabled: true,
            voiceCommandsEnabled: false,
            language: 'auto',
            tipTone: 'mindful',
            longEnabled: false,  // Disable long breaks for demo
            endTime: '18:00',
            longBreakLength: 5,
            longBreakFrequency: 60,
            phoneHapticsEnabled: false
          },
          onboardingComplete: true
        });
        
        // Wait a moment for storage to persist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Start the session
        await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
        
        // Wait a moment for alarm to be created
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Close the tab
        window.close();
      } catch (e) {
        console.error('Demo mode error:', e);
        alert('Demo mode failed. Please try the full setup instead.');
      }
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
    const { settings = {} } = await chrome.storage.local.get(['settings']);
    await chrome.storage.local.set({ 
      settings: { ...settings, audioEnabled: enabled }
    });
  });
  
  setupToggle(voiceCommandsToggle, async (enabled) => {
    const { settings = {} } = await chrome.storage.local.get(['settings']);
    await chrome.storage.local.set({ 
      settings: { ...settings, voiceCommandsEnabled: enabled }
    });
  });
  
  // Language selector
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
      const { settings = {} } = await chrome.storage.local.get(['settings']);
      await chrome.storage.local.set({ 
        settings: { ...settings, language: e.target.value }
      });
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
        settings: {
          audioEnabled,
          voiceCommandsEnabled: voiceEnabled,
          language
        }
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
