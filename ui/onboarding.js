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
        const tab = await chrome.tabs.create({ 
          url: 'https://www.google.com',
          active: true 
        });
        
        // Wait for the content script to inject
        console.log('Waiting for content script...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Show multiple demo break cards to showcase different features
        async function showDemoBreaks() {
          // 1. Show short break (Mindful tone)
          console.log('Showing short break (Mindful)...');
          await chrome.storage.local.set({
            settings: {
              audioEnabled: true,
              voiceCommandsEnabled: false,
              language: 'auto',
              tipTone: 'mindful'
            }
          });
          await chrome.tabs.sendMessage(tab.id, {
            type: 'GIA_SHOW_BREAK',
            breakType: 'short',
            durationMs: 20000,
            demo: true,
            tone: 'mindful'
          });
          
          // Wait for user to dismiss or complete
          await new Promise(resolve => setTimeout(resolve, 25000));
          
          // 2. Show short break (Goofy tone)
          console.log('Showing short break (Goofy)...');
          await chrome.storage.local.set({
            settings: {
              audioEnabled: true,
              voiceCommandsEnabled: false,
              language: 'auto',
              tipTone: 'goofy'
            }
          });
          await chrome.tabs.sendMessage(tab.id, {
            type: 'GIA_SHOW_BREAK',
            breakType: 'short',
            durationMs: 20000,
            demo: true,
            tone: 'goofy'
          });
          
          await new Promise(resolve => setTimeout(resolve, 25000));
          
          // 3. Show long break
          console.log('Showing long break...');
          await chrome.tabs.sendMessage(tab.id, {
            type: 'GIA_SHOW_BREAK',
            breakType: 'long',
            durationMs: 300000, // 5 minutes
            demo: true
          });
        }
        
        // Send demo break message to the new tab with retry
        let attempts = 0;
        while (attempts < 10) {
          try {
            console.log('Triggering demo sequence, attempt', attempts + 1);
            await showDemoBreaks();
            console.log('Demo sequence completed');
            break;
          } catch (e) {
            attempts++;
            console.log('Attempt', attempts, 'failed:', e.message);
            if (attempts < 10) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }
        
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
