# Gia — Mindful 20-20-20

> **Your AI-powered digital wellness companion that helps build healthier screen habits through mindful breaks and intelligent reflection.**

Gia — Mindful 20-20-20 is based on research showing that 20-second gaze breaks every 20 minutes reduce digital eye strain and support ocular comfort. Drawing on the AOA's 20-20-20 rule and related studies in *Contact Lens & Anterior Eye*, Gia uses adaptive tone feedback and time-based prompts to turn screen breaks into a simple, science-backed wellness habit.

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v0.6.0-blue.svg)](https://github.com/lewis-mi/gia-extension)
[![Built with Chrome AI](https://img.shields.io/badge/Built%20with-Chrome%20Built--in%20AI-green.svg)](https://developer.chrome.com/docs/web-platform/built-in-ai)
[![Privacy First](https://img.shields.io/badge/Privacy-First%20Design-purple.svg)](#privacy--security)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎓 Hackathon Submission

**Built for:** Google Chrome Built-in AI Challenge 2025

**APIs Used:**
- **Writer API**: Generates dynamic, personalized break reminder messages
- **Rewriter API**: Adapts message tone (Mindful/Goofy) based on user preference
- **Translator API**: Multilingual support for break reminders
- **Proofreader API**: Cleans user reflection journal entries
- **Summarizer API**: Generates wellness insights from reflection patterns
- **Prompt API**: Voice command classification for natural language interaction

**Problem Solved:** Digital eye strain affects 90% of computer users, leading to headaches, blurred vision, and long-term damage. The proven 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds) is effective but requires consistent reminders that most people forget during focused work sessions.

**Demo Video:** [Coming Soon - Will be uploaded to YouTube/Vimeo]()

---

## 🎯 Problem Statement

Digital eye strain affects **90% of computer users** and can lead to headaches, blurred vision, and long-term eye damage. The 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds) is proven effective, but most people forget to take breaks when focused on work.

**Gia solves this by:**
- 🤖 **AI-powered reminders** that adapt to your preferences
- 🎤 **Multimodal interaction** with voice and screen analysis
- 📝 **Intelligent reflection** system for mindfulness tracking
- 🔒 **100% private** - all AI processing happens locally with Gemini Nano

---

## 🔬 Scientific Foundation & Design Rationale

Gia — Mindful 20-20-20 is grounded in peer-reviewed ocular research and official optometric guidance. Its design translates evidence-based insights about visual ergonomics, comfort, and behavior change into a user-friendly Chrome experience.

### 1. Preventing Digital Eye Strain

The **American Optometric Association (AOA)** recommends the 20-20-20 Rule—taking a 20-second break every 20 minutes to look at something approximately 20 feet away—to reduce digital eye strain.

Research published in *Contact Lens & Anterior Eye* (2024) found that such structured gaze breaks improved tear-film stability and reduced symptoms of fatigue, dryness, and blurred vision compared to continuous screen use.

**Takeaway:** Regular, brief visual pauses restore blink rate and ocular moisture—principles Gia automates with gentle, time-based prompts.

### 2. Mindful Resets for Comfort and Recovery

Findings from *Hot Towels: The Bedrock of Meibomian Gland Dysfunction Therapy* (2023) show that warmth and rest improve tear-film lipid flow and comfort. Gia's longer "reset" breaks are conceptually inspired by this effect, encouraging users to step away and recalibrate attention.

### 3. Behavioral Adherence Through Emotional Design

*Evidence-Based Teaching in Contact Lenses Education* (2022) highlights that multimodal, tone-adapted feedback increases engagement and adherence. Gia applies this insight through selectable tone modes—Mindful or Goofy—that keep the experience personal and sustainable.

### Evidence Translation Table

| Evidence Source | Design Translation |
|----------------|-------------------|
| AOA 20-20-20 guideline | 20-second short-break timer |
| Tear-film studies | Eye-health rationale for gaze shifts |
| Warm-compress research | Inspiration for long resets |
| Behavioral cue research | Tone-adaptive reminders for adherence |

**Design Philosophy:** Gia combines ocular science with human-centered design, transforming routine screen breaks into meaningful, evidence-informed digital wellbeing habits.

---

## ✨ Features

### **Built with Chrome Built-in AI APIs**

All AI features run locally using Gemini Nano for complete privacy:

- **Writer API**: Creates unique, personalized break reminders that adapt to context and work duration
- **Rewriter API**: Seamlessly switches tone between Mindful and Goofy styles
- **Translator API**: Supports multiple languages for global accessibility
- **Proofreader API**: Enhances user reflection journal entries while preserving voice
- **Summarizer API**: Identifies wellness patterns and provides encouraging insights
- **Prompt API**: Classifies voice commands ("snooze", "dismiss", "start") with natural language processing

### **User Experience**

- **3-Screen Onboarding**: Quick setup with Demo Mode for instant testing
- **Demo Mode**: Click "Try Demo" to experience 3 consecutive breaks showcasing all features
  - Break 1: Mindful tone with calm, slow voice
  - Break 2: Goofy tone with fun knock-knock jokes
  - Break 3: Long break with entertaining message
- **Tone Customization**: Choose between Mindful 🧘‍♀️ or Goofy 🤪 personalities
- **Voice-Guided Breaks**: Text-to-speech reads break instructions with tone-specific pacing
- **Visual Countdown**: Circular timer shows seconds/minutes remaining
- **Smart Break Timing**: 20-second breaks every 20 minutes
- **Long Breaks**: Optional extended resets every 60-120 minutes
- **End Notification**: "Break complete" audio when timer finishes
- **Material Design 3**: Beautiful, accessible interface throughout

### **Privacy & Security**

- **Local Processing**: All AI runs on-device with Gemini Nano
- **No Data Transmission**: User data never leaves the browser
- **Encrypted Storage**: Local data encrypted with Chrome's secure storage
- **Minimal Permissions**: Only requests necessary permissions

---

## 🚀 Installation & Setup

### **Prerequisites**
- Chrome 138+ with Built-in AI APIs enabled
- Chrome Built-in AI Early Preview Program access

### **Installation (For Judges)**

1. Clone this repository:
   ```bash
   git clone https://github.com/lewis-mi/gia-extension.git
   cd gia-extension
   ```

2. Open Chrome Extensions:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. Load the extension:
   - Click "Load unpacked"
   - Select the `gia-extension` folder
   - Grant necessary permissions when prompted

### **Quick Demo Mode**

Click **"🚀 Try Demo"** on the first screen to:
- Skip setup and start immediately
- Try all features with default settings
- Experience AI-generated break reminders
- Configure later if desired

### **Full Setup**

Complete the 3-screen onboarding:
- **Screen 1**: Choose audio, voice commands, and language
- **Screen 2**: Pick your tone (Mindful 🧘‍♀️ or Goofy 🤪)
- **Screen 3**: Set end time, long breaks, and phone haptics

---

## 🎮 Usage Guide

### **Basic Interaction**

- **Break Notifications**: Appears every 20 minutes (automatically)
- **Voice Commands**: Say "snooze", "dismiss", or "start" during breaks
- **Popup Controls**: Click the extension icon for pause/resume/exit
- **Keyboard Shortcut**: `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac)

### **AI-Powered Features**

- **Dynamic Messages**: Every break reminder is uniquely generated using the Writer API
- **Tone Adaptation**: Switch between Mindful and Goofy anytime (Rewriter API)
- **Multilingual**: Break reminders in your preferred language (Translator API)
- **Reflection Journal**: Enhanced with proofreading and insights (Proofreader & Summarizer APIs)

### **Settings**

Access settings via the extension popup to:
- Toggle audio/voice commands
- Switch tone preferences
- Adjust break timing
- Enable long breaks and haptics

---

## 🏗️ Technical Architecture

### **Core Technologies**
- **Chrome Extension Manifest v3** with service worker architecture
- **Chrome Built-in AI APIs** powered by Gemini Nano (local processing)
- **Material Design 3** for consistent, accessible UI
- **Chrome Storage API** for persistent settings
- **Chrome Alarms API** for break scheduling
- **Chrome Notifications API** for gentle reminders

### **AI Integration Points**

1. **Break Message Generation** (`ai/breakMessageGenerator.js`)
   - Writer API creates personalized reminders
   - Rewriter API adapts tone dynamically
   - Translator API supports multilingual output

2. **Voice Interaction** (`content.js`)
   - Prompt API classifies intent from natural language
   - Supports "snooze", "dismiss", "start" commands

3. **Reflection Processing** (`ai/breakMessageGenerator.js`)
   - Proofreader API cleans and enhances journal entries
   - Summarizer API identifies wellness patterns

### **File Structure**
```
gia-extension/
├── background.js              # Service worker & break scheduling
├── content.js                 # Voice commands & break cards
├── manifest.json              # Extension configuration
├── ai/
│   └── breakMessageGenerator.js  # All 6 AI API implementations
├── ui/
│   ├── popup.html/js          # Main controls
│   ├── onboarding.html/js     # Screen 1: Setup
│   ├── onboarding_tone.html/js # Screen 2: Tone selection
│   └── onboarding_duration.html/js # Screen 3: Duration & Long Breaks
└── data/
    ├── tone_profiles.json     # Mindful/Goofy definitions
    └── evidence_summaries.json # Wellness tips
```

---

## 🧪 Testing

### **Manual Testing**

1. Install the extension (see Installation above)
2. Use Demo Mode for quick testing
3. Wait 20 minutes for first break (or manually trigger)
4. Test voice commands: say "snooze" or "dismiss"
5. Try tone switching in settings
6. Check reflection journal functionality

### **Automated Testing**

```bash
# Run Playwright tests
npm run pw:test

# Run Cypress tests
npm run cy:run
```

---

## 📚 Documentation

- [SUBMISSION.md](SUBMISSION.md) - Detailed API usage and hackathon entry
- [HACKATHON_CHECKLIST.md](HACKATHON_CHECKLIST.md) - Pre-submission checklist
- [LICENSE](LICENSE) - MIT License

---


## 🤝 Contributing

This is a hackathon submission project. For contributions, please open an issue or pull request.

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

## 👤 Author

**Michael Lewis**
- GitHub: [@lewis-mi](https://github.com/lewis-mi)
- Repository: https://github.com/lewis-mi/gia-extension
- Built for: Google Chrome Built-in AI Challenge 2025

---

## 🙏 Acknowledgments

- Google Chrome team for Built-in AI APIs
- Gemini Nano for on-device AI processing
- Material Design 3 for UI guidelines
- All users fighting digital eye strain
