// ===== GIA ONBOARDING =====
// Enhanced onboarding with multiple steps

let currentStep = 0;
const totalSteps = 1; // Single page for now

const startBtn = document.getElementById('startBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');

async function init() {
  if (startBtn) {
    startBtn.addEventListener('click', completeOnboarding);
  }
  
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', handleLearnMore);
  }
}

function handleLearnMore() {
  // Show the modal dialog
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.add('show');
  }
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('show');
  }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      // If clicking the overlay itself (not the dialog content), close the modal
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  const dismissBtn = document.getElementById('dismissBtn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', closeModal);
  }
});

async function completeOnboarding() {
  // Navigate to tone selection page (step 2)
  const tonePageUrl = chrome.runtime.getURL('ui/onboarding_tone.html');
  window.location.href = tonePageUrl;
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
