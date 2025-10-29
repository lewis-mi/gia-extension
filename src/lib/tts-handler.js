// ===== TTS HANDLER =====
// Manages text-to-speech functionality with tone-specific audio profiles.

import { TONE_STYLES } from '../ai/toneProfiles.js';
import { getSettings } from './settings-storage.js';

/**
 * Speaks a given text using Chrome's TTS engine with tone-specific settings.
 * @param {string} text - The text to be spoken.
 * @param {string} tone - The desired tone ('mindful' or 'goofy').
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function speakWithTTS(text, tone = 'mindful') {
  return new Promise(async (resolve) => {
    const { audioEnabled, language } = await getSettings();

    // Do not speak if audio is disabled in settings
    if (audioEnabled === false) {
      return resolve({ success: false, error: 'Audio is disabled' });
    }

    // Get the audio characteristics (rate, pitch, volume) for the selected tone
    const toneProfile = TONE_STYLES[tone] || TONE_STYLES.mindful;

    const ttsOptions = {
      lang: language && language !== 'auto' ? language : 'en-US',
      rate: toneProfile.rate,
      pitch: toneProfile.pitch,
      volume: toneProfile.volume,
      onEvent: (event) => {
        if (event.type === 'end') {
          resolve({ success: true });
        } else if (event.type === 'error') {
          console.error('TTS Error:', event.errorMessage);
          resolve({ success: false, error: event.errorMessage });
        }
      },
    };

    // Stop any currently speaking audio before starting new audio
    chrome.tts.stop();
    chrome.tts.speak(text, ttsOptions);
  });
}