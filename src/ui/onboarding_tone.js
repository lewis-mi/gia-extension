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
  const continueBtn = document.getElementById('continueBtn');
  const successMessage = document.getElementById('successMessage');
  
  // Handle tone selection and navigate to next screen
  async function proceedToNextScreen(tone) {
    if (hasCompleted) return; // Prevent double-submission
    hasCompleted = true;
    
    // Save the selected tone
    await setSettings({ tipTone: tone });
    
    // Navigate to duration/schedule screen
    const durationPageUrl = chrome.runtime.getURL('src/ui/onboarding_duration.html');
    window.location.href = durationPageUrl;
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
      const onboardingUrl = chrome.runtime.getURL('src/ui/onboarding.html');
      window.location.href = onboardingUrl;
    });
  }
  
  // Continue button - use default Mindful tone and proceed
  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      await proceedToNextScreen('mindful');
    });
  }
  
  // Tone selection buttons
  if (goofyBtn) {
    goofyBtn.addEventListener('click', () => {
      selectTone('goofy');
      // Navigate to next screen after brief delay
      setTimeout(() => proceedToNextScreen('goofy'), 1000);
    });
  }
  
  if (mindfulBtn) {
    mindfulBtn.addEventListener('click', () => {
      selectTone('mindful');
      // Navigate to next screen after brief delay
      setTimeout(() => proceedToNextScreen('mindful'), 1000);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
