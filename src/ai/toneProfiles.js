// toneProfiles.js
// Tone-specific audio characteristics for Mindful and Goofy voices

export const TONE_STYLES = {
  mindful: {
    description: "calm, centered, and soothing — like a guided meditation narrator",
    rate: 0.8, // Even slower for a more meditative pace
    pitch: 0.8,  // Deeper pitch for a more grounding, calm voice
    volume: 0.9, // Keep volume clear but not loud
    promptStyle: `Speak this line in a warm, slow, and grounded tone — imagine guiding a meditation.
Use smooth rhythm, low volume, and no sudden inflection.
Pause naturally between phrases.
Do not sound robotic or overly formal.`,
  },
  goofy: {
    description: "playful, expressive, and cartoonish — like a cheerful friend or sidekick",
    rate: 1.1, // Faster for more energy and excitement
    pitch: 1.3, // Noticeably higher pitch for a fun, animated character voice
    volume: 1.0, // Max volume for an energetic presence
    promptStyle: `Speak this line in a fun, goofy tone — animated and slightly exaggerated,
like a cartoon sidekick who's excited to help. Use playful rhythm, upbeat pacing,
and big vocal expressions (smiles, laughter hints).
End each line with rising intonation or comedic timing.`,
  },
};
