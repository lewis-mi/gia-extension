// toneProfiles.js
// Tone-specific audio characteristics for Mindful and Goofy voices

export const TONE_STYLES = {
  mindful: {
    description: "calm, centered, and soothing — like a guided meditation narrator",
    rate: 0.9,
    pitch: 0.9,
    volume: 0.85,
    promptStyle: `Speak this line in a warm, slow, and grounded tone — imagine guiding a meditation.
Use smooth rhythm, low volume, and no sudden inflection.
Pause naturally between phrases.
Do not sound robotic or overly formal.`,
  },
  goofy: {
    description: "playful, expressive, and cartoonish — like a cheerful friend or sidekick",
    rate: 1.25,
    pitch: 1.25,
    volume: 1.0,
    promptStyle: `Speak this line in a fun, goofy tone — animated and slightly exaggerated,
like a cartoon sidekick who's excited to help. Use playful rhythm, upbeat pacing,
and big vocal expressions (smiles, laughter hints).
End each line with rising intonation or comedic timing.`,
  },
};

