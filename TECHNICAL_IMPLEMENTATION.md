# How Gia Works — Technical Implementation

## Overview

Gia is a Manifest V3 Chrome Extension that uses **Gemini Nano** through Chrome's Built-in AI APIs, enabling all AI processing to occur directly on the user's device—no cloud servers, no data sharing, full offline functionality.

---

## Core Architecture

### **Background Service Worker** (`background.js`)
- **Purpose**: Schedules 20-minute timers and long-break detection
- **Features**:
  - Chrome Alarms API for timing breaks
  - Chrome Storage API for tone, interval, and settings
  - Integration with AI message generator

### **Content Scripts** (`content.js`)
- **Purpose**: Display break reminders and handle voice responses
- **Features**:
  - Visual break cards with 5-stage progression
  - Voice command recognition using Prompt API
  - Multimodal interaction support

### **Local Storage**
- Stores user preferences (tone, intervals, reflections)
- Encrypted via Chrome's secure storage
- No data transmission to external servers

### **Privacy-First AI Workflows**
- Real-time text generation using Writer API
- Voice command classification using Prompt API
- Pattern summarization for wellness insights

---

## APIs Used & Their Implementation

### 1. **Prompt API** (`chrome.ai.prompt`)
**Purpose**: Classifies voice commands for natural language interaction

**Implementation**: `content.js` → `classifyIntent()` function

```javascript
// Classifies user voice commands into: start, snooze, or dismiss
const session = await chrome.ai.prompt.create({
  systemPrompt: "You classify user voice commands into exactly one intent: start, snooze, or dismiss."
});
```

**Used for**: Processing voice commands ("snooze", "dismiss", "start") during breaks

---

### 2. **Writer API** (`chrome.ai.writer`)
**Purpose**: Creates dynamic, personalized break reminder messages

**Implementation**: `ai/breakMessageGenerator.js` → `generateBreakMessage()`

```javascript
// Generates unique reminders based on tone and work duration
const session = await chrome.ai.writer.create({
  systemPrompt: tonePrompt  // Mindful or Goofy assistant
});
const message = await session.write(`Create a ${tone} reminder...`);
```

**Used for**: Generating unique break messages that adapt to user's tone preference and work duration

---

### 3. **Rewriter API** (`chrome.ai.rewriter`)
**Purpose**: Adapts message tone to match user preference (Mindful ↔ Goofy)

**Implementation**: `ai/breakMessageGenerator.js` → `rewriteMessage()`

```javascript
// Adapts existing messages to different tone
const session = await chrome.ai.rewriter.create({
  systemPrompt: `Adapt messages to be ${targetTone}`
});
```

**Used for**: Tone switching functionality, reworking messages to match selected tone

---

### 4. **Proofreader API** (`chrome.ai.proofreader`)
**Purpose**: Enhances user reflection journal entries while preserving voice

**Implementation**: `ai/breakMessageGenerator.js` → `proofreadReflection()`

```javascript
// Cleans grammar and spelling while preserving user's voice
const session = await chrome.ai.proofreader.create({
  systemPrompt: 'Clean up grammar and spelling while preserving the user\'s voice'
});
```

**Used for**: Improving readability of user reflection journal entries

---

### 5. **Summarizer API** (`chrome.ai.summarizer`)
**Purpose**: Produces concise, on-device summaries of wellness patterns

**Implementation**: `ai/breakMessageGenerator.js` → `summarizeReflections()`

```javascript
// Identifies key wellness patterns from user reflections
const session = await chrome.ai.summarizer.create({
  systemPrompt: 'Identify key wellness patterns from user reflections'
});
```

**Used for**: Generating insights from multiple reflection entries to identify patterns

---

### 6. **Translator API** (`chrome.ai.translator`)
**Purpose**: Adds multilingual accessibility to break reminders

**Implementation**: `ai/breakMessageGenerator.js` → `translateMessage()`

```javascript
// Translates messages naturally while keeping friendly tone
const session = await chrome.ai.translator.create({
  systemPrompt: 'Translate naturally while keeping friendly tone'
});
```

**Used for**: Supporting multiple languages for global accessibility

---

## AI Integration Flow

### **Break Message Generation**

1. Background service worker detects break time (every 20 minutes)
2. Calls `generateBreakMessage()` from `ai/breakMessageGenerator.js`
3. Writer API creates personalized message based on:
   - User's selected tone (Mindful or Goofy)
   - Work duration elapsed
   - Previous break patterns
4. Message displayed via Chrome Notifications or TTS

### **Voice Command Processing**

1. User speaks during break ("snooze", "dismiss", etc.)
2. Content script captures audio via Web Speech Recognition
3. `classifyIntent()` function uses Prompt API to determine intent
4. Action executed (break dismissed, snoozed, or started)

### **Tone Adaptation**

1. User changes tone preference in settings
2. Rewriter API adapts existing messages to new tone
3. Future messages generated in selected style

---

## Technology Stack

### **Frontend**
- **HTML**: Structure for popup, onboarding, and break cards
- **CSS**: Material Design 3 styling with CSS variables
- **JavaScript**: ES6+ with async/await for AI integration

### **APIs**
- **Chrome Built-in AI**: Prompt, Writer, Rewriter, Proofreader, Summarizer, Translator
- **Chrome Extension APIs**: Storage, Alarms, Notifications, TTS, Offscreen
- **AI Engine**: Gemini Nano (on-device processing)

### **Version Control**
- **GitHub**: Public repository for hackathon submission
- **License**: MIT

---

## Privacy Architecture

### **On-Device Processing**
- All AI operations run locally via Gemini Nano
- No data sent to external servers
- No API keys required (uses Chrome's built-in AI)

### **Local Storage**
- Settings: `chrome.storage.local` for user preferences
- Counters: Tracks break frequency and elapsed time
- Reflections: User journal entries stored locally

### **No Data Transmission**
- Tone preferences stay on device
- Reflection journal never leaves browser
- Break patterns analyzed locally

---

## File Structure

```
gia-extension/
├── manifest.json              # Extension configuration
├── background.js                # Service worker (timers, AI integration)
├── content.js                 # Voice commands & break cards
├── ai/
│   └── breakMessageGenerator.js  # All 6 AI API implementations
├── ui/
│   ├── popup.html/js          # Main controls
│   ├── onboarding.html/js     # Setup screen
│   ├── onboarding_tone.html/js # Tone selection
│   └── onboarding_duration.html/js # Duration & long breaks
├── data/
│   ├── tone_profiles.json     # Mindful/Goofy definitions
│   └── evidence_summaries.json # Wellness tips
└── tts/
    └── shortBreak.js          # Text-to-speech for breaks
```

---

## Key Technical Features

- **Service Worker**: Manages alarms and AI message generation
- **Content Script**: Injects break cards and handles voice input
- **AI Integration**: Seamless on-device processing with Gemini Nano
- **Offline Support**: Full functionality without internet connection
- **Privacy-First**: All data processing occurs locally in the browser

---

## Development Notes

- **Minimum Chrome Version**: 138 (required for Built-in AI APIs)
- **Manifest Version**: 3 (latest Chrome Extension standard)
- **Module System**: ES6 modules for clean code organization
- **Error Handling**: Graceful fallbacks when AI APIs unavailable

