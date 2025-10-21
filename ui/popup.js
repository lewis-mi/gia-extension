const voiceEnabled = document.getElementById('voiceEnabled');
const grantMic = document.getElementById('grantMic');
const micStatus = document.getElementById('micStatus');

(async () => {
  const { voiceEnabled: v = false } = await chrome.storage.local.get('voiceEnabled');
  voiceEnabled.checked = !!v;
})();

voiceEnabled.addEventListener('change', async () => {
  await chrome.storage.local.set({ voiceEnabled: !!voiceEnabled.checked });
});

grantMic.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    micStatus.textContent = 'Microphone granted ✓';
  } catch (e) {
    micStatus.textContent = 'Microphone denied';
  }
});
