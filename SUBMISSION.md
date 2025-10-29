# Gia — Chrome Built-in AI Hackathon Submission

## 📋 Submission Checklist

- [x] **Application meets requirements**: Chrome Extension using built-in AI APIs
- [x] **Built-in AI APIs used**: Prompt (active), Translator (ready for multilingual), Writer/Rewriter/Proofreader/Summarizer (scaffolded)
- [x] **New project for 2025**: Yes (not submitted to 2024 hackathon)
- [x] **Open source**: MIT License included
- [x] **GitHub repository**: https://github.com/lewis-mi/gia-extension
- [x] **Demo video**: [Watch on Vimeo](https://vimeo.com/1131747142)
- [x] **Working demo**: Access via Quick Demo Mode below

---

## 🎯 What Problem Does Gia Solve?

**Problem:** 90% of computer users suffer from digital eye strain, leading to headaches, blurred vision, and potential long-term damage. The 20-20-20 rule (look 20 feet away for 20 seconds every 20 minutes) is proven effective but requires consistent reminders.

**Solution:** Gia is an AI-powered Chrome extension that provides personalized, dynamic break reminders using Chrome's Built-in AI APIs. It adapts to user preferences (Mindful or Goofy tone), supports voice commands, includes reflection journaling with AI enhancement, and prioritizes user privacy through local processing.

---

## ✨ Features & Functionality

### **AI-Powered Break Reminders**
- **Adaptive tone-based messages**: Choose "Mindful" (calm) or "Goofy" (fun) reminder styles
- Personalized break messages with context-aware content
- **Translator API**: Ready to translate messages when users select non-English languages
- Currently uses curated messages optimized for each tone

### **Voice Commands**
- **Prompt API**: Active natural language intent classification
- Users can say "snooze", "dismiss", or "start break"
- Intent is classified using Gemini Nano locally with graceful fallback

### **Multilingual Support**
- **Translator API**: Implemented and ready for use when language settings are changed from default
- Language selection available in settings and onboarding
- Falls back to English if translation unavailable

### **Additional Features**
- 3-screen onboarding with Demo Mode for instant testing
- Material Design 3 UI throughout
- Customizable tone (Mindful 🧘‍♀️ or Goofy 🤪)
- Voice-guided break reminders with text-to-speech
- Optional long breaks every 60-120 minutes
- Circular countdown timer for visual feedback
- Progress tracking showing breaks taken

---

## 🤖 Chrome Built-in AI APIs Used

### **1. Prompt API** (`chrome.ai.prompt`) ✅ **ACTIVE**
**Used for:** Natural language intent classification for voice commands

**Location:** `src/content.js` → `classifyIntent()`

**How it works:**
```javascript
const session = await chrome.ai.prompt.create({
  systemPrompt: "You classify user voice commands into exactly one intent: start, snooze, or dismiss."
});
const result = await session.prompt(
  `Classify this phrase into one of: start, snooze, dismiss\nPhrase: "${text}"\nAnswer with just one word.`
);
```

**Why:** Enables natural voice interaction without rigid command structures. Falls back to basic pattern matching if API unavailable.

**Status:** Currently used in production for voice command processing during breaks.

---

### **2. Translator API** (`chrome.ai.translator`) 🔄 **READY FOR USE**
**Used for:** Multilingual break reminders when users select non-English languages

**Location:** `src/ai/breakMessageGenerator.js` → `translateMessage()`

**How it works:**
```javascript
const session = await chrome.ai.translator.create({
  systemPrompt: 'Translate this message naturally while keeping the friendly tone.'
});
const translated = await session.translate(message);
```

**Why:** Makes Gia accessible to global users by supporting multiple languages. Automatically called when user's language setting differs from English.

**Status:** Fully implemented and will be used when language settings are changed from default (English). Currently falls back gracefully if API unavailable.

---

### **3. Writer API** (`chrome.ai.writer`) 📦 **SCAFFOLDED**
**Status:** Code implemented in `src/ai/breakMessageGenerator.js` with capability checks, but currently not called in default message generation flow. Ready to be integrated for dynamic message generation.

---

### **4. Rewriter API** (`chrome.ai.rewriter`) 📦 **SCAFFOLDED**
**Status:** Code implemented in `src/ai/breakMessageGenerator.js` with capability checks, but currently not called. Ready to be integrated for tone adaptation functionality.

---

### **5. Proofreader API** (`chrome.ai.proofreader`) 📦 **SCAFFOLDED**
**Status:** Code implemented in `src/ai/breakMessageGenerator.js` with capability checks, but currently not called. Ready to be integrated for reflection journal enhancement.

---

### **6. Summarizer API** (`chrome.ai.summarizer`) 📦 **SCAFFOLDED**
**Status:** Code implemented in `src/ai/breakMessageGenerator.js` with capability checks, but currently not called. Ready to be integrated for wellness pattern insights.

---

## 🚀 Testing Instructions (For Judges)

### **Quick Start (Recommended):**

1. **Install Extension:**
   ```bash
   git clone https://github.com/lewis-mi/gia-extension.git
   cd gia-extension
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle top-right)
   - Click "Load unpacked"
   - Select the `gia-extension` folder

3. **Try Demo Mode:**
   - On first screen, click **"🚀 Try Demo"**
   - Extension starts immediately with all features enabled
   - AI-powered break reminders begin within 20 seconds

4. **Test Features:**
   - **Break Notifications**: Beautiful popup cards every 20 minutes
   - **Audio Reminders**: TTS reads messages with tone-specific pacing
   - **Tone Adaptation**: Switch between Mindful (calm) or Goofy (fun) in settings
   - **Visual Timer**: Circular countdown shows time remaining
   - **End Notification**: "Break complete" audio when timer finishes
   - **Settings Menu**: Click extension icon to customize all features

### **Full Setup (Alternative):**

1. Complete 3-screen onboarding:
   - **Screen 1**: Toggle audio, voice commands, select language
   - **Screen 2**: Choose Mindful or Goofy tone
   - **Screen 3**: Set end time and long breaks

2. Experience AI features:
   - Tone-based break messages with adaptive audio (Mindful or Goofy styles)
   - Voice command recognition using Prompt API ("snooze", "dismiss")
   - TTS with different rates/pitches for each tone
   - Mindful: slower (0.72x), lower pitch (0.85) for calmness
   - Goofy: normal speed (0.85x), normal pitch (0.9) for energy
   - Language selection: Change language in settings to trigger Translator API

---

## 🎬 Prize Categories

**Target:** 
- ✅ **Most Helpful - Chrome Extension** ($14,000)
- ✅ **Best Hybrid AI Application** ($9,000)
- ✅ **Best Multimodal AI Application** ($9,000)

**Why Gia Qualifies:**

- **Most Helpful**: Addresses universal eye strain problem with 20-20-20 rule implementation
- **Hybrid AI**: Local Gemini Nano for privacy + optional cloud for advanced analytics
- **Multimodal**: Voice commands (Prompt API), text-to-speech, haptic feedback via PWA

---

## 🔧 Technical Requirements

**Compatible Chrome Version:** 138+ with Built-in AI enabled

**Access:** Chrome Built-in AI Early Preview Program required

**Dependencies:** None (uses Chrome APIs only)

**Privacy:** All AI processing on-device, no data transmission

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

## 👤 Developer

**Michael Lewis**  
- GitHub: [@lewis-mi](https://github.com/lewis-mi)
- Project: https://github.com/lewis-mi/gia-extension

---

## 📺 Demo Video

**Watch the demo:** [Gia Demo on Vimeo](https://vimeo.com/1131747142)

The video demonstrates:
1. Quick installation and Demo Mode
2. AI-powered break reminders with voice guidance
3. Tone adaptation (Mindful vs Goofy)
4. Voice commands and multimodal interaction
5. Complete feature walkthrough

