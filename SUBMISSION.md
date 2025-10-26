# Gia — Chrome Built-in AI Hackathon Submission

## 📋 Submission Checklist

- [x] **Application meets requirements**: Chrome Extension using built-in AI APIs
- [x] **Built-in AI APIs used**: Writer, Rewriter, Translator, Proofreader, Summarizer, Prompt
- [x] **New project for 2025**: Yes (not submitted to 2024 hackathon)
- [x] **Open source**: MIT License included
- [x] **GitHub repository**: https://github.com/lewis-mi/gia-extension
- [ ] **Demo video**: Coming soon (to be updated)
- [x] **Working demo**: Access via Quick Demo Mode below

---

## 🎯 What Problem Does Gia Solve?

**Problem:** 90% of computer users suffer from digital eye strain, leading to headaches, blurred vision, and potential long-term damage. The 20-20-20 rule (look 20 feet away for 20 seconds every 20 minutes) is proven effective but requires consistent reminders.

**Solution:** Gia is an AI-powered Chrome extension that provides personalized, dynamic break reminders using Chrome's Built-in AI APIs. It adapts to user preferences (Mindful or Goofy tone), supports voice commands, includes reflection journaling with AI enhancement, and prioritizes user privacy through local processing.

---

## ✨ Features & Functionality

### **AI-Powered Break Reminders**
- **Writer API**: Generates dynamic, context-aware break messages
- **Rewriter API**: Adapts tone (Mindful/Goofy based on user preference)
- **Translator API**: Multilingual support for break reminders
- Personalized based on work duration and user tone selection

### **Voice Commands**
- **Prompt API**: Natural language intent classification
- Users can say "snooze", "dismiss", or "start break"
- Intent is classified using Gemini Nano locally

### **Reflection Journaling**
- **Proofreader API**: Cleans and improves user reflection entries
- **Summarizer API**: Generates insights from reflection patterns
- Privacy-first: All processing on-device

### **Additional Features**
- 3-screen onboarding with Demo Mode for quick testing
- Material Design 3 UI throughout
- Customizable tone (Mindful 🧘‍♀️ or Goofy 🤪)
- Optional long breaks with haptics
- Progress tracking and analytics

---

## 🤖 Chrome Built-in AI APIs Used

### **1. Writer API** (`chrome.ai.writer`)
**Used for:** Generating dynamic, personalized break reminder messages

**Location:** `ai/breakMessageGenerator.js` → `generateBreakMessage()`

**How it works:**
```javascript
const session = await chrome.ai.writer.create({
  systemPrompt: tonePrompt  // Mindful or Goofy assistant
});
const message = await session.write(
  `Create a ${tone} reminder for a 20-second eye break...`
);
```

**Why:** Instead of static messages, Gia generates unique, context-aware reminders that adapt to user tone preference and work duration.

---

### **2. Rewriter API** (`chrome.ai.rewriter`)
**Used for:** Tone adaptation of break messages

**Location:** `ai/breakMessageGenerator.js` → `rewriteMessage()`

**How it works:**
```javascript
const session = await chrome.ai.rewriter.create({
  systemPrompt: `Adapt messages to be ${targetTone}`
});
const rewritten = await session.rewrite(message);
```

**Why:** Allows users to change tone preferences and have existing messages adapted accordingly.

---

### **3. Translator API** (`chrome.ai.translator`)
**Used for:** Multilingual break reminders

**Location:** `ai/breakMessageGenerator.js` → `translateMessage()`

**How it works:**
```javascript
const session = await chrome.ai.translator.create({
  systemPrompt: 'Translate naturally while keeping friendly tone'
});
const translated = await session.translate(message);
```

**Why:** Makes Gia accessible to global users by supporting multiple languages.

---

### **4. Proofreader API** (`chrome.ai.proofreader`)
**Used for:** Cleaning user reflection journal entries

**Location:** `ai/breakMessageGenerator.js` → `proofreadReflection()`

**How it works:**
```javascript
const session = await chrome.ai.proofreader.create({
  systemPrompt: 'Clean grammar and spelling while preserving voice'
});
const cleaned = await session.proofread(text);
```

**Why:** Improves readability of user reflections without changing their meaning or voice.

---

### **5. Summarizer API** (`chrome.ai.summarizer`)
**Used for:** Generating wellness insights from reflection patterns

**Location:** `ai/breakMessageGenerator.js` → `summarizeReflections()`

**How it works:**
```javascript
const session = await chrome.ai.summarizer.create({
  systemPrompt: 'Identify key wellness patterns from reflections'
});
const summary = await session.summarize(combinedReflections);
```

**Why:** Helps users understand their wellness patterns without reading through all individual reflections.

---

### **6. Prompt API** (`chrome.ai.prompt`)
**Used for:** Natural language intent classification for voice commands

**Location:** `content.js` → `classifyIntent()`

**How it works:**
```javascript
const session = await chrome.ai.prompt.create({
  systemPrompt: "Classify voice commands into: start, snooze, or dismiss"
});
const result = await session.prompt(
  `Classify: "${text}" → Answer with just one word.`
);
```

**Why:** Enables natural voice interaction without rigid command structures.

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
   - **Break Notifications**: Appears every 20 minutes
   - **Voice Commands**: Say "snooze" or "dismiss" during breaks
   - **Tone Adaptation**: Go to Settings to switch between Mindful/Goofy
   - **Popup**: Click extension icon to see controls
   - **Corner Logo**: Hover for quick status

### **Full Setup (Alternative):**

1. Complete 3-screen onboarding:
   - **Screen 1**: Toggle audio/voice, select language
   - **Screen 2**: Choose Mindful or Goofy tone
   - **Screen 3**: Set end time, long breaks, phone haptics

2. Experience AI features:
   - Dynamic break messages (Writer API)
   - Voice command recognition (Prompt API)
   - Tone-based adaptation (Rewriter API)
   - Reflection journaling (Proofreader/Summarizer APIs)

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

*Coming Soon - Will be uploaded to YouTube/Vimeo*

**Plan:**
1. Install and Quick Demo Mode (30s)
2. Show AI-generated break reminders (1m)
3. Test voice commands (30s)
4. Demonstrate tone switching (30s)
5. Show reflection journaling (30s)
6. Wrap up and closing (30s)

**Total:** Under 3 minutes

