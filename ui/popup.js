const voiceEnabled = document.getElementById('voiceEnabled');
const hybridAIEnabled = document.getElementById('hybridAIEnabled');
const analyticsEnabled = document.getElementById('analyticsEnabled');
const takeBreakNow = document.getElementById('takeBreakNow');
const breakStats = document.getElementById('breakStats');
const reflectionSummary = document.getElementById('reflectionSummary');

(async () => {
  const { 
    voiceEnabled: v = false, 
    hybridAIEnabled: h = false, 
    analyticsEnabled: a = false 
  } = await chrome.storage.local.get(['voiceEnabled', 'hybridAIEnabled', 'analyticsEnabled']);
  
  voiceEnabled.checked = !!v;
  hybridAIEnabled.checked = !!h;
  analyticsEnabled.checked = !!a;
  
  await loadProgressData();
})();

voiceEnabled.addEventListener('change', async () => {
  await chrome.storage.local.set({ voiceEnabled: !!voiceEnabled.checked });
});

hybridAIEnabled.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({
    type: 'GIA_TOGGLE_HYBRID_AI',
    enabled: hybridAIEnabled.checked,
    analytics: analyticsEnabled.checked
  });
});

analyticsEnabled.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({
    type: 'GIA_TOGGLE_HYBRID_AI',
    enabled: hybridAIEnabled.checked,
    analytics: analyticsEnabled.checked
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
      breakCount = 0, 
      reflections = [], 
      lastReflectionSummary,
      hybridAIEnabled = false 
    } = await chrome.storage.local.get([
      'breakCount', 'reflections', 'lastReflectionSummary', 'hybridAIEnabled'
    ]);
    
    // Update break stats
    breakStats.innerHTML = `
      <strong>Breaks taken today:</strong> ${breakCount}<br>
      <strong>Reflections saved:</strong> ${reflections.length}
      ${hybridAIEnabled ? '<br><strong>Hybrid AI:</strong> Enabled' : ''}
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
    
    // Load advanced insights if hybrid AI is enabled
    if (hybridAIEnabled && reflections.length >= 3) {
      try {
        const insights = await chrome.runtime.sendMessage({ type: 'GIA_ADVANCED_INSIGHTS' });
        if (insights && insights.wellness_trends) {
          reflectionSummary.innerHTML += `<br><strong>Advanced insights:</strong> ${insights.wellness_trends}`;
        }
      } catch (e) {
        console.warn('Failed to load advanced insights:', e);
      }
    }
  } catch (e) {
    console.error('Failed to load progress data:', e);
    breakStats.textContent = 'Unable to load progress';
  }
}
