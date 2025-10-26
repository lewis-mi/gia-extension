const voiceEnabled = document.getElementById('voiceEnabled');
const audioEnabled = document.getElementById('audioEnabled');
const takeBreakNow = document.getElementById('takeBreakNow');
const breakStats = document.getElementById('breakStats');

(async () => {
  const { 
    settings = {}
  } = await chrome.storage.local.get(['settings']);
  
  voiceEnabled.checked = settings.voiceCommandsEnabled || false;
  audioEnabled.checked = settings.audioEnabled !== false;
  
  await loadProgressData();
})();

voiceEnabled.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, voiceCommandsEnabled: voiceEnabled.checked }
  });
});

audioEnabled.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, audioEnabled: audioEnabled.checked }
  });
});

takeBreakNow.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'GIA_IMMEDIATE_BREAK' });
    window.close();
  } catch (e) {
    console.error('Failed to trigger break:', e);
  }
});

async function loadProgressData() {
  try {
    const { 
      counters = {} 
    } = await chrome.storage.local.get(['counters']);
    
    const breakCount = counters.totalBreaks || 0;
    
    // Update break stats
    breakStats.innerHTML = `
      <strong>Breaks taken:</strong> ${breakCount}
    `;
  } catch (e) {
    console.error('Failed to load progress data:', e);
    breakStats.textContent = 'Unable to load progress';
  }
}
