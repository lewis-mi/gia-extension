const voiceEnabled = document.getElementById('voiceEnabled');
const audioEnabled = document.getElementById('audioEnabled');
const languageSelect = document.getElementById('languageSelect');
const mindfulBtn = document.getElementById('mindfulBtn');
const goofyBtn = document.getElementById('goofyBtn');
const longEnabled = document.getElementById('longEnabled');
const longBreakControls = document.getElementById('longBreakControls');
const breakLength = document.getElementById('breakLength');
const breakFrequency = document.getElementById('breakFrequency');
const endTime = document.getElementById('endTime');
const takeBreakNow = document.getElementById('takeBreakNow');
const quitGia = document.getElementById('quitGia');

(async () => {
  const { 
    settings = {} 
  } = await chrome.storage.local.get(['settings']);
  
  // Load settings from storage
  voiceEnabled.checked = settings.voiceCommandsEnabled || false;
  audioEnabled.checked = settings.audioEnabled !== false;
  languageSelect.value = settings.language || 'auto';
  
  // Tone selection
  const tone = settings.tipTone || 'mindful';
  if (tone === 'mindful') {
    mindfulBtn.classList.add('selected');
    goofyBtn.classList.remove('selected');
  } else {
    goofyBtn.classList.add('selected');
    mindfulBtn.classList.remove('selected');
  }
  
  // Long breaks
  longEnabled.checked = settings.longEnabled || false;
  if (longEnabled.checked) {
    longBreakControls.style.display = 'block';
  }
  breakLength.value = settings.longBreakLength || 5;
  breakFrequency.value = settings.longBreakFrequency || 60;
  
  // End time
  endTime.value = settings.endTime || '18:00';
  
})();

// Voice commands toggle
voiceEnabled.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, voiceCommandsEnabled: voiceEnabled.checked }
  });
});

// Audio toggle
audioEnabled.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, audioEnabled: audioEnabled.checked }
  });
});

// Language select
languageSelect.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, language: languageSelect.value }
  });
});

// Tone selection
async function selectTone(tone) {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  
  if (tone === 'mindful') {
    mindfulBtn.classList.add('selected');
    goofyBtn.classList.remove('selected');
  } else {
    goofyBtn.classList.add('selected');
    mindfulBtn.classList.remove('selected');
  }
  
  await chrome.storage.local.set({ 
    settings: { ...settings, tipTone: tone }
  });
}

mindfulBtn.addEventListener('click', () => selectTone('mindful'));
goofyBtn.addEventListener('click', () => selectTone('goofy'));

// Long breaks toggle
longEnabled.addEventListener('change', async () => {
  if (longEnabled.checked) {
    longBreakControls.style.display = 'block';
  } else {
    longBreakControls.style.display = 'none';
  }
  
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, longEnabled: longEnabled.checked }
  });
});

// Long break duration
breakLength.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, longBreakLength: parseInt(breakLength.value) }
  });
});

breakFrequency.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, longBreakFrequency: parseInt(breakFrequency.value) }
  });
});

// End time
endTime.addEventListener('change', async () => {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  await chrome.storage.local.set({ 
    settings: { ...settings, endTime: endTime.value }
  });
});

// Take break now
takeBreakNow.addEventListener('click', async () => {
  // Save all current settings
  const currentSettings = {
    paused: false, // Gia is always enabled from the settings popup
    voiceCommandsEnabled: voiceEnabled.checked,
    audioEnabled: audioEnabled.checked,
    language: languageSelect.value,
    tipTone: mindfulBtn.classList.contains('selected') ? 'mindful' : 'goofy',
    longEnabled: longEnabled.checked,
    longBreakLength: parseInt(breakLength.value),
    longBreakFrequency: parseInt(breakFrequency.value),
    endTime: endTime.value
  };
  
  await chrome.storage.local.set({ settings: currentSettings });
  
  // Reschedule alarms with new settings
  await chrome.runtime.sendMessage({ type: 'GIA_RESCHEDULE' });
  
  // Close popup
  window.close();
});

// Quit Gia button
quitGia.addEventListener('click', async () => {
  // Send exit message to background script
  await chrome.runtime.sendMessage({ type: 'gia.exit' });
  
  // Close popup
  window.close();
});

// Progress tracking removed
