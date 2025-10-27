// ===== GIA SHORT BREAK TTS =====
// Text-to-speech functionality for short breaks

const SHORT_BREAK_MESSAGES = [
  "Time for a 20-second break. Look 20 feet away and soften your gaze.",
  "Your eyes need a rest. Look far away for 20 seconds now.",
  "Follow the 20-20-20 rule. Look into the distance and relax your eyes.",
  "Break time. Find something 20 feet away and focus on it for 20 seconds.",
  "Give your eyes a moment. Look across the room and gently defocus."
];

const TONE_PROFILES = {
  mindful: {
    rate: 0.85,             // Slower, more natural
    pitch: 0.95,           // Slightly lower for warmth
    volume: 0.9,           // Clear but gentle
    lang: 'en-US'
  },
  goofy: {
    rate: 1.05,            // Faster, energetic
    pitch: 1.05,          // Higher pitch, playful
    volume: 0.9,          // Clear and audible
    lang: 'en-US'
  },
  motivating: {
    rate: 1.0,
    pitch: 1.05,
    volume: 0.9
  },
  professional: {
    rate: 0.92,
    pitch: 1.0,
    volume: 0.85
  },
  friendly: {
    rate: 0.95,
    pitch: 1.05,
    volume: 0.9
  }
};

export async function playShortBreakTTS(message = null, tone = 'mindful') {
  return await speakBreakMessage(message, tone, false);
}

async function speakBreakMessage(message = null, tone = 'mindful', isFirstBreak = false) {
  try {
    const text = message || (isFirstBreak 
      ? "Welcome to Gia. Time for your first break. Every 20 minutes, look 20 feet away for 20 seconds. This helps prevent eye strain and keeps your vision healthy."
      : SHORT_BREAK_MESSAGES[Math.floor(Math.random() * SHORT_BREAK_MESSAGES.length)]
    );
    
    const profile = TONE_PROFILES[tone] || TONE_PROFILES.mindful;
    
    // Use chrome.tts API if available
    if (chrome?.tts) {
      await new Promise((resolve, reject) => {
        chrome.tts.speak(text, {
          enqueue: false,
          rate: profile.rate,
          pitch: profile.pitch,
          volume: profile.volume,
          requiredEventTypes: ['end'],
          onEvent: (event) => {
            if (event.type === 'end') resolve();
          }
        }, (error) => {
          if (error) reject(error);
        });
      });
    } else {
      // Fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = profile.volume;
      
      await new Promise((resolve, reject) => {
        utterance.onend = resolve;
        utterance.onerror = reject;
        window.speechSynthesis.speak(utterance);
      });
    }
    
    return true;
  } catch (e) {
    console.error('TTS failed:', e);
    return false;
  }
}

async function playMeditationBell() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Generate gentle meditation bell sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    return true;
  } catch (e) {
    console.error('Audio playback failed:', e);
    return false;
  }
}

// Message handler for background script
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type === 'GIA_TTS_SHORT_BREAK') {
      const result = await speakBreakMessage(msg.message, msg.tone, msg.isFirstBreak);
      sendResponse({ success: result });
      return true;
    }
    
    if (msg.type === 'GIA_TTS_BELL') {
      const result = await playMeditationBell();
      sendResponse({ success: result });
      return true;
    }
  });
}

// Export for use in content scripts or other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    speakBreakMessage,
    playMeditationBell
  };
}

