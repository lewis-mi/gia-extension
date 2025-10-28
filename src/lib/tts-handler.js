// ===== TTS HANDLER MODULE =====
// Handles text-to-speech with multiple fallback methods

import { TONE_STYLES } from '../ai/toneProfiles.js';

/**
 * Speak text with tone-specific voice
 * @param {string} text - Text to speak
 * @param {string} tone - Tone style ('mindful' | 'goofy')
 * @returns {Promise<object>} Response with audio data or success status
 */
export async function speakWithTTS(text, tone = 'mindful') {
  try {
    const profile = TONE_STYLES[tone] || TONE_STYLES.mindful;

    // Try high-quality Prompt API audio first
    if (chrome?.ai?.prompt) {
      try {
        const prompt = `${profile.promptStyle}\n\nText to speak: "${text}"`;

        const res = await chrome.ai.prompt({
          prompt,
          output_audio_format: "wav"
        });

        if (res?.output_audio) {
          // Return audio data for content script to play
          return {
            success: true,
            audioData: res.output_audio,
            audioFormat: "wav"
          };
        }
      } catch (e) {
        console.log('Prompt API audio not available, falling back to chrome.tts');
      }
    }

    // Fallback to chrome.tts with tone-specific parameters
    chrome.tts.speak(text, {
      enqueue: false,
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume
    });

    return { success: true };
  } catch (e) {
    console.error('TTS speak error:', e);
    return { error: e.message };
  }
}

/**
 * Stop all currently playing TTS audio
 */
export function stopAllAudio() {
  try { 
    chrome.tts.stop(); 
  } catch (e) {
    console.warn('Could not stop audio:', e);
  }
}
