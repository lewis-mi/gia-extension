// ===== GIA OFFSCREEN DOCUMENT =====
// Runs in an offscreen document for advanced audio processing
// Used when we need more control over TTS and audio synthesis

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  try {
    if (msg.type === 'GIA_OFFSCREEN_TTS') {
      await speakTTS(msg.text, msg.options);
      sendResponse({ success: true });
      return true;
    }

    if (msg.type === 'GIA_OFFSCREEN_BELL') {
      await playBellSound(msg.type);
      sendResponse({ success: true });
      return true;
    }

    if (msg.type === 'GIA_OFFSCREEN_AUDIO') {
      const audio = await generateAudioTone(msg.frequency, msg.duration);
      sendResponse({ data: audio });
      return true;
    }
  } catch (e) {
    console.error('Offscreen processing error:', e);
    sendResponse({ success: false, error: e.message });
  }
  
  return true;
});

async function speakTTS(text, options = {}) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = options.rate || 0.9;
  speech.pitch = options.pitch || 1.0;
  speech.volume = options.volume || 0.8;
  
  if (options.voice) {
    speech.voice = options.voice;
  }

  return new Promise((resolve, reject) => {
    speech.onend = resolve;
    speech.onerror = reject;
    window.speechSynthesis.speak(speech);
  });
}

async function playBellSound(type = 'meditation') {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Meditation bell: gentle chime
  if (type === 'meditation') {
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
  
  // Long break: gong sound
  if (type === 'long') {
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 1.0);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.0);
  }
  
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

async function generateAudioTone(frequency, duration) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
  
  // Convert to audio data
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
  return buffer;
}

