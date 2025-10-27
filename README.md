# Gia — Mindful 20-20-20

**A Chrome Extension that helps users prevent digital eyestrain and cognitive fatigue by turning the 20-20-20 rule into an effortless, mindful habit.**  
Every 20 minutes, Gia reminds users to look 20 feet away for 20 seconds — using perceptually optimized design and adaptive AI for personalized wellness.

---

## Overview

Gia transforms evidence-based visual ergonomics into a seamless, AI-powered browser experience. Built with Chrome's built-in AI models, it blends behavioral science, accessibility, and human-centered design to support visual well-being without interrupting concentration.

---

## Condensed Summary

**Gia — Mindful 20-20-20** is based on research showing that 20-second gaze breaks every 20 minutes reduce digital eye strain and support ocular comfort. Drawing on the AOA's 20-20-20 rule and related studies in Contact Lens & Anterior Eye, Gia uses adaptive tone feedback and time-based prompts to turn screen breaks into a simple, science-backed wellness habit.

---

## Features

- **Time-Based Microbreaks** — Automatically triggers brief wellness reminders every 20 minutes
- **Adaptive Tone** — Choose "Mindful" (calm, relaxing) or "Goofy" (energetic, fun) reminder styles
- **Voice-Guided Breaks** — Audio instructions with text-to-speech for hands-free breaks
- **Long Breaks** (Optional) — Extended 5-minute breaks during extended work sessions
- **Demo Mode** — Click "🚀 Try Demo" on the first screen to experience Gia immediately
- **Privacy-First** — Runs entirely client-side, no data collection

---

## Chrome Built-in AI APIs Used

- **Prompt API** — Voice command classification ("dismiss", "snooze")
- **Writer API** — Dynamic text generation for break reminders
- **Rewriter API** — Tone adaptation of messages (Mindful vs Goofy)
- **Translator API** — Multilingual support
- **Proofreader API** — Grammar and spelling correction
- **Summarizer API** — Generating insights from text

---

## Quick Demo Mode

Click **"🚀 Try Demo"** on the first onboarding screen for an immediate experience:

**Break 1 (Mindful - 20 seconds):**
- Message: "Take a 20-second break. Look 20 feet away and blink gently. Let's take a little rest. I'll let you know when time is up."
- Voice: Slow (0.72x), calm pitch
- Shows circular countdown timer
- Audio notification when complete

**Break 2 (Goofy - 20 seconds):**
- Message: "Take a 20-second break. Look 20 feet away and blink gently. [Knock-knock joke]. I'll let you know when time is up."
- Voice: Normal speed (0.85x), energetic pitch
- Fun, entertaining content

**Break 3 (Long - 5 minutes):**
- Message: "Take 5. Time to touch grass but here's one for the road. Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!"
- Extended break demonstration

---

## Scientific Foundation & Design Rationale

Gia — Mindful 20-20-20 is grounded in peer-reviewed ocular research and official optometric guidance. Its design translates evidence-based insights about visual ergonomics, comfort, and behavior change into a user-friendly Chrome experience.

### 1. Preventing Digital Eye Strain

The American Optometric Association (AOA) recommends the 20-20-20 Rule—taking a 20-second break every 20 minutes to look at something approximately 20 feet away—to reduce digital eye strain. Research published in Contact Lens & Anterior Eye (2024) found that such structured gaze breaks improved tear-film stability and reduced symptoms of fatigue, dryness, and blurred vision compared to continuous screen use. 

**Takeaway:** Regular, brief visual pauses restore blink rate and ocular moisture—principles Gia automates with gentle, time-based prompts.

### 2. Mindful Resets for Comfort and Recovery

Findings from Hot Towels: The Bedrock of Meibomian Gland Dysfunction Therapy (2023) show that warmth and rest improve tear-film lipid flow and comfort. Gia's longer "reset" breaks are conceptually inspired by this effect, encouraging users to step away and recalibrate attention.

### 3. Behavioral Adherence Through Emotional Design

Evidence-Based Teaching in Contact Lenses Education (2022) highlights that multimodal, tone-adapted feedback increases engagement and adherence. Gia applies this insight through selectable tone modes—Mindful or Goofy—that keep the experience personal and sustainable.

**Summary:**

| Insight | Evidence Source | Design Translation |
|---------|----------------|-------------------|
| AOA 20-20-20 guideline | Official optometric recommendation | 20-second short-break timer |
| Tear-film studies | Contact Lens & Anterior Eye (2024) | Eye-health rationale for gaze shifts |
| Warm-compress research | Meibomian gland therapy (2023) | Inspiration for long resets |
| Behavioral cue research | Evidence-Based Teaching (2022) | Tone-adaptive reminders for adherence |

**Design Philosophy:** Gia combines ocular science with human-centered design, transforming routine screen breaks into meaningful, evidence-informed digital wellbeing habits.

---

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder
6. Click "🚀 Try Demo" in the onboarding for an immediate experience

---

## Hackathon Submission

- **Team:** Michaela Lewis
- **API Challenge:** Chrome Built-in AI APIs (6 used)
- **Problem Solved:** Digital eye strain prevention through automated 20-20-20 rule adherence
- **Demo Video:** [Add YouTube link]
- **Live Demo:** Use "🚀 Try Demo" button in onboarding

---

## Architecture

- **Frontend:** Chrome Extension (Manifest V3)
- **AI Layer:** Chrome Built-in AI APIs (Prompt, Writer, Rewriter, Translator, Proofreader, Summarizer)
- **State Management:** Chrome Storage API
- **Audio:** Chrome TTS API
- **Scheduling:** Chrome Alarms API

---

## Ethical and Accessibility Considerations

- WCAG-compliant color contrast and visual hierarchy
- Optional audio toggle for low-vision users
- Full local execution for privacy and transparency
- No data collection or analytics

---

## References

- American Optometric Association. (2023). *Computer Vision Syndrome (Digital Eye Strain).* Retrieved from https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome
- Contact Lens & Anterior Eye (2024). *Structured gaze breaks improve tear-film stability.*
- Hot Towels: The Bedrock of Meibomian Gland Dysfunction Therapy (2023).
- Evidence-Based Teaching in Contact Lenses Education (2022).

---

## License

MIT
