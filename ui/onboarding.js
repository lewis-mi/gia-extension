// ===== GIA ONBOARDING SCREEN 1: SETUP =====

async function init() {
  console.log('Onboarding init started');
  const demoBtn = document.getElementById('demoBtn');
  const continueBtn = document.getElementById('continueBtn');
  const audioToggle = document.getElementById('audioToggle');
  const voiceCommandsToggle = document.getElementById('voiceCommandsToggle');
  const languageSelect = document.getElementById('languageSelect');
  
  console.log('Demo button found:', !!demoBtn);
  console.log('Continue button found:', !!continueBtn);
  
  // Demo mode - skip onboarding and start immediately
  if (demoBtn) {
    console.log('Attaching demo button listener...');
    demoBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Demo button clicked!', e);
      console.log('Starting demo mode setup...');
      try {
        console.log('Setting demo settings...');
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
        console.log('Sending GIA_RESCHEDULE message...');
        const response = await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
        console.log('Message response:', response);
        
        // Create immediate demo alarm for quick testing
        console.log('Creating demo alarm (30 seconds)...');
        await chrome.alarms.create('gia-demo', { delayInMinutes: 0.5 });
        console.log('Demo alarm created');
        
        // Create a demo page where the break card can be shown
        console.log('Opening demo page...');
        await chrome.tabs.create({ 
          url: 'https://www.google.com',
          active: true 
        });
        
        // Wait for the page to load completely
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Send demo break message to the new tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        for (const tab of tabs) {
          // Try multiple times to ensure content script has loaded
          let attempts = 0;
          while (attempts < 5) {
            try {
              console.log('Sending break message to tab:', tab.id, 'attempt', attempts + 1);
              await chrome.tabs.sendMessage(tab.id, {
                type: 'GIA_SHOW_BREAK',
                breakType: 'short',
                durationMs: 20000
              });
              console.log('Message sent successfully on attempt', attempts + 1);
              break;
            } catch (e) {
              attempts++;
              console.log('Attempt', attempts, 'failed:', e.message);
              if (attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
        }
        
        // Wait a moment for alarm to be created
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('Closing onboarding tab...');
        // Close the onboarding tab
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
