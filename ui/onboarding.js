// ===== GIA ONBOARDING =====
// Enhanced onboarding with multiple steps

let currentStep = 0;
const totalSteps = 1; // Single page for now

const startBtn = document.getElementById('startBtn');

async function init() {
  if (!startBtn) return;
  
  startBtn.addEventListener('click', completeOnboarding);
}

async function completeOnboarding() {
  // Mark onboarding as complete
  await chrome.storage.local.set({ onboardingComplete: true });
  
  // Start the session
  await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
  
  // Close this tab
  window.close();
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

