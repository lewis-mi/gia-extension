// toneProfiles.js
// Tone-specific audio characteristics for Mindful and Goofy voices

export const TONE_STYLES = {
  mindful: {
    description: "calm, centered, and soothing delivery — like a meditation guide",
    rate: 0.95,
    pitch: 1.0,
    promptStyle: `Speak this line in a calm, warm tone with steady pacing. Avoid strong emotion; sound mindful and gentle.`,
  },
  goofy: {
    description: "playful, energetic, slightly silly delivery — like a friendly cartoon",
    rate: 1.1,
    pitch: 1.2,
    promptStyle: `Speak this line with a lighthearted, goofy tone. Use expressive intonation and cheerful pacing.`,
  },
};

