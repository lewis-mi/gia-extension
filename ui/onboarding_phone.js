// ===== CONFIG =====
const PWA_URL = "https://YOUR-PROJECT-ID.web.app"; // <-- replace with your real URL

// ===== ONBOARDING FLOW =====
async function completeOnboarding() {
  await chrome.storage.local.set({ onboardingComplete: true });
  // Tell background to (re)schedule alarms
  try { await chrome.runtime.sendMessage({ type: "GIA_RESCHEDULE" }); } catch {}
  window.close();
}

function bindCopyLink() {
  const phoneUrl = document.getElementById("phoneUrl");
  const copyUrl  = document.getElementById("copyUrl");
  const openPwa  = document.getElementById("openPwa");
  if (!phoneUrl || !copyUrl || !openPwa) return;

  // Populate controls with the live PWA URL
  phoneUrl.value = PWA_URL;
  openPwa.href   = PWA_URL;

  copyUrl.onclick = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(phoneUrl.value);
      copyUrl.textContent = "Copied!";
    } catch {
      copyUrl.textContent = "Failed :(";
    } finally {
      setTimeout(() => (copyUrl.textContent = "Copy"), 1200);
    }
  };
}

function bindButtons() {
  const startBtn = document.getElementById("startBtn");
  const skipBtn  = document.getElementById("skipBtn");
  if (startBtn) startBtn.addEventListener("click", completeOnboarding);
  if (skipBtn)  skipBtn.addEventListener("click", () => window.close());
}

function init() {
  bindCopyLink();
  bindButtons();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

