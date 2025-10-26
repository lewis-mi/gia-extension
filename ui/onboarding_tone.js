// ===== GIA TONE SELECTION ONBOARDING =====

let selectedTone = 'mindful'; // Default selection
let hasCompleted = false; // Prevent double-submission

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

function init() {
  const goofyBtn = document.getElementById('goofyBtn');
  const mindfulBtn = document.getElementById('mindfulBtn');
  const backBtn = document.getElementById('backBtn');
  const skipBtn = document.getElementById('skipBtn');
  const successMessage = document.getElementById('successMessage');
  
  // Handle tone selection and complete onboarding
  async function completeOnboarding(tone, showSuccess = true) {
    if (hasCompleted) return; // Prevent double-submission
    hasCompleted = true;
    
    // Show success message
    if (showSuccess && successMessage) {
      successMessage.classList.add('show');
      await new Promise(resolve => setTimeout(resolve, 1500));
      successMessage.classList.remove('show');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Save the selected tone
    await setSettings({ tipTone: tone });
    
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
  }
  
  // Handle tone selection (don't auto-complete, just select)
  function selectTone(tone) {
    selectedTone = tone;
    
    // Update button styles
    [goofyBtn, mindfulBtn].forEach(btn => {
      btn.classList.remove('selected');
      const textDiv = btn.querySelector('.tone-button-text-outline, .tone-button-text-primary');
      if (btn.dataset.tone === tone) {
        btn.classList.add('selected');
        textDiv.className = 'tone-button-text-primary';
        // Preserve emoji in text content
        const label = btn.dataset.tone === 'goofy' ? 'Goofy 🤪' : 'Mindful 🧘‍♀️';
        textDiv.textContent = label;
      } else {
        textDiv.className = 'tone-button-text-outline';
        const label = btn.dataset.tone === 'goofy' ? 'Goofy 🤪' : 'Mindful 🧘‍♀️';
        textDiv.textContent = label;
      }
    });
  }
  
  // Back button - go to previous step
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const onboardingUrl = chrome.runtime.getURL('ui/onboarding.html');
      window.location.href = onboardingUrl;
    });
  }
  
  // Skip button - use default Mindful tone
  if (skipBtn) {
    skipBtn.addEventListener('click', async () => {
      await completeOnboarding('mindful', true);
    });
  }
  
  // Tone selection buttons
  if (goofyBtn) {
    goofyBtn.addEventListener('click', () => {
      selectTone('goofy');
      // Auto-complete after 1 second
      setTimeout(() => completeOnboarding('goofy', true), 1000);
    });
  }
  
  if (mindfulBtn) {
    mindfulBtn.addEventListener('click', () => {
      selectTone('mindful');
      // Auto-complete after 1 second
      setTimeout(() => completeOnboarding('mindful', true), 1000);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
