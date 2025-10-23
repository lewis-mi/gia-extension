const voiceEnabled = document.getElementById('voiceEnabled');
const takeBreakNow = document.getElementById('takeBreakNow');
const breakStats = document.getElementById('breakStats');
const reflectionSummary = document.getElementById('reflectionSummary');

(async () => {
  const { voiceEnabled: v = false } = await chrome.storage.local.get('voiceEnabled');
  voiceEnabled.checked = !!v;
  
  await loadProgressData();
})();

voiceEnabled.addEventListener('change', async () => {
  await chrome.storage.local.set({ voiceEnabled: !!voiceEnabled.checked });
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
    const { breakCount = 0, reflections = [], lastReflectionSummary } = await chrome.storage.local.get([
      'breakCount', 'reflections', 'lastReflectionSummary'
    ]);
    
    // Update break stats
    breakStats.innerHTML = `
      <strong>Breaks taken today:</strong> ${breakCount}<br>
      <strong>Reflections saved:</strong> ${reflections.length}
    `;
    
    // Show reflection summary if available
    if (lastReflectionSummary) {
      reflectionSummary.innerHTML = `
        <strong>Recent insights:</strong> ${lastReflectionSummary}
      `;
    } else if (reflections.length > 0) {
      reflectionSummary.innerHTML = `
        <em>Keep reflecting to see personalized insights!</em>
      `;
    }
  } catch (e) {
    console.error('Failed to load progress data:', e);
    breakStats.textContent = 'Unable to load progress';
  }
}
