// ttsHelper.js
// High-quality voice via Prompt API (audio), with safe fallbacks.
// Expose: TTS.speak(text, {tone, rate, pitch}), TTS.canHighQuality()

const TTS = (() => {
  let voicesLoaded = false;

  function pickWebSpeechVoice() {
    const list = window.speechSynthesis?.getVoices?.() || [];
    // Prefer a natural Google voice if present
    return (
      list.find(v => v.name.includes("Google US English")) ||
      list.find(v => v.lang?.startsWith("en")) ||
      null
    );
  }

  async function speakWebSpeech(text, { rate = 1.0, pitch = 1.05 } = {}) {
    return new Promise(resolve => {
      if (!("speechSynthesis" in window)) return resolve(false);
      // Voices may load async; attempt once
      if (!voicesLoaded) {
        const onVoices = () => {
          voicesLoaded = true;
          window.speechSynthesis.onvoiceschanged = null;
        };
        window.speechSynthesis.onvoiceschanged = onVoices;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rate;
      u.pitch = pitch;
      const v = pickWebSpeechVoice();
      if (v) u.voice = v;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      window.speechSynthesis.speak(u);
    });
  }

  async function speakChromeTTS(text, { rate = 1.0, pitch = 1.05 } = {}) {
    return new Promise(resolve => {
      if (!chrome?.tts?.speak) return resolve(false);
      chrome.tts.speak(text, {
        rate,
        pitch,
        onEvent: (e) => {
          if (e.type === "end" || e.type === "interrupted" || e.type === "error") {
            resolve(e.type !== "error");
          }
        }
      });
    });
  }

  function canHighQuality() {
    // Feature-detect Prompt API audio
    return !!(chrome?.ai?.prompt && typeof chrome.ai.prompt === "function");
  }

  async function speakWithPromptAudio(text, { tone = "Mindful" } = {}) {
    try {
      // Single-shot audio generation (if supported) — WAV output
      const prompt = `
Rephrase for a ${tone.toLowerCase()} wellness reminder, brief and friendly:
"${text}"
`;
      const res = await chrome.ai.prompt({
        prompt,
        output_audio_format: "wav"
      });
      if (!res?.output_audio) return false;

      const blob = new Blob([res.output_audio], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = reject;
        audio.play().catch(reject);
      });
      
      return true;
    } catch (err) {
      console.log('Prompt API audio failed:', err);
      return false;
    }
  }

  // Main entry
  async function speak(text, { tone = "Mindful", rate, pitch } = {}) {
    // 1) Try high-quality Prompt API audio
    if (canHighQuality()) {
      const ok = await speakWithPromptAudio(text, { tone });
      if (ok) return true;
    }
    // 2) Fallback to chrome.tts
    const okTTS = await speakChromeTTS(text, { rate, pitch });
    if (okTTS) return true;

    // 3) Fallback to Web Speech
    const okWeb = await speakWebSpeech(text, { rate, pitch });
    return okWeb;
  }

  return { speak, canHighQuality };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TTS;
}

