/**
 * @file Defines the voice and style profiles for different AI tones.
 * These profiles are used to generate more realistic and expressive TTS audio.
 */

export const TONE_STYLES = {
  mindful: {
    // A detailed prompt for the AI to adopt a specific persona.
    promptStyle: "You are a calm and gentle wellness guide. Your voice is soothing, warm, and slow. Speak the following text in a relaxing and mindful tone, as if you are leading a short meditation.",
    // Fallback parameters for the standard chrome.tts API.
    rate: 0.85,
    pitch: 0.9,
    volume: 0.8,
  },
  goofy: {
    // A detailed prompt for a more playful persona.
    promptStyle: "You are a fun and energetic cartoon character. Your voice is playful, friendly, and a little bit silly. Speak the following text in an upbeat and goofy tone, as if you are telling a fun secret to a friend.",
    // Fallback parameters for the standard chrome.tts API.
    rate: 1.0,
    pitch: 1.1,
    volume: 0.9,
  },
};