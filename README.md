# 🌿 Gia: The Good Intentions Assistant
A Chrome Extension that helps users prevent digital eyestrain and cognitive fatigue by turning the 20-20-20 rule into an effortless, mindful habit.
Every 20 minutes, Gia reminds users to look 20 feet away for 20 seconds — using perceptually optimized design and adaptive AI for personalized wellness.

## Overview
Gia transforms evidence-based visual ergonomics into a seamless, AI-powered browser experience. Built with Chrome's built-in AI models, it blends behavioral science, accessibility, and human-centered design to support visual well-being without interrupting concentration.

## Condensed Summary
Gia: The Good Intentions Assistant is based on research showing that 20-second gaze breaks every 20 minutes reduce digital eye strain and support ocular comfort. Drawing on the AOA's 20-20-20 rule and related studies in *Contact Lens & Anterior Eye*, Gia uses adaptive tone feedback and time-based prompts to turn screen breaks into a simple, science-backed wellness habit.

## Features
- **Time-Based Microbreaks** — Automatically triggers brief wellness reminders every 20 minutes  
- **Adaptive Tone** — Choose "Mindful" (calm, relaxing) or "Goofy" (energetic, fun) reminder styles  
- **Voice-Guided Breaks** — Audio instructions with text-to-speech for hands-free breaks  
- **Long Breaks (Optional)** — Extended 5-minute breaks during long sessions  
- **Demo Mode** — Click "🚀 Try Demo" on the first screen to experience Gia immediately  
- **Privacy-First** — Runs entirely client-side, no data collection  

## Chrome Built-in AI APIs Used
- **Prompt API** — Voice command classification ("dismiss", "snooze")  
- **Writer API** — Dynamic text generation for break reminders  
- **Rewriter API** — Tone adaptation of messages (Mindful vs Goofy)  
- **Translator API** — Multilingual support  
- **Proofreader API** — Grammar and spelling correction  
- **Summarizer API** — Generating insights from text  

## Quick Demo Mode
Click "🚀 Try Demo" on the first onboarding screen for an immediate experience:

**Break 1 (Mindful - 20 seconds):**
> “Take a 20-second break. Look 20 feet away and blink gently. Let's take a little rest. I'll let you know when time is up.”  
Slow (0.72x), calm pitch — circular countdown timer — soft audio chime when complete  

**Break 2 (Goofy - 20 seconds):**
> “Take a 20-second break. Look 20 feet away and blink gently. [Knock-knock joke]. I'll let you know when time is up.”  
Normal speed (0.85x), energetic pitch — light humor for engagement  

**Break 3 (Long - 5 minutes):**
> “Take 5. Time to touch grass—but here’s one for the road. Knock knock. Who’s there? Cow says. Cow says who? No, a cow says moo!”  
Demonstrates extended break mode  

## 🧬 Scientific & Cognitive Foundations
**Gia: The Good Intentions Assistant** combines research from optometry, cognitive psychology, and human-computer interaction to support digital well-being through perceptually optimized, AI-assisted design.

### 👁️ Eye Health and Visual Ergonomics
The **American Optometric Association (AOA)** recommends the 20-20-20 Rule—taking a 20-second break every 20 minutes to look about 20 feet away—to reduce digital eye strain.  
Studies in *Contact Lens & Anterior Eye* (2024) show that these structured gaze breaks improve tear-film stability and reduce fatigue and dryness.  
Gia automates this process through gentle, timed reminders that help restore blink rate and ocular comfort without disrupting concentration.

Longer “reset” breaks draw inspiration from *Hot Towels: The Bedrock of Meibomian Gland Dysfunction Therapy* (2023), which links warmth and rest to improved comfort and tear-film health.  
Behavioral research from *Evidence-Based Teaching in Contact Lenses Education* (2022) further demonstrates that tone-adaptive feedback increases engagement, informing Gia’s **Mindful** and **Goofy** tone options.

### 🧠 Cognitive Load and Attention
Beyond physiology, Gia’s interface is grounded in perceptual and attention research.  
According to **Lavie and Tsal (1994)**, high perceptual load causes users to suppress peripheral cues—a reason visual alerts often go unnoticed during focused work. Gia counters this with **soft motion, subtle contrast, and rhythmic timing** that maintain awareness without distraction.  

Meanwhile, **Gorbatova et al. (2023)** describe *banner blindness*—a learned suppression of banner-like visuals regardless of salience. Gia avoids this by using conversational micro-cards and contextual timing rather than bright, ad-like banners, ensuring cues are perceived as supportive rather than intrusive.

**Design takeaway:** Gia integrates evidence from eye-health research and cognitive theory to create reminders that are gentle, visible, and trustworthy—supporting focus while protecting visual comfort.

## Installation
1. Clone this repository  
2. Open Chrome and navigate to `chrome://extensions/`  
3. Enable “Developer mode” (toggle in top right)  
4. Click “Load unpacked”  
5. Select the extension folder  
6. Click "🚀 Try Demo" in the onboarding for an immediate experience  

## Hackathon Submission
**Team:** Michaela Lewis  
**API Challenge:** Chrome Built-in AI APIs (6 used)  
**Problem Solved:** Digital eye strain prevention through automated 20-20-20 rule adherence  
**Demo Video:** [Add YouTube link]  
**Live Demo:** Use "🚀 Try Demo" button in onboarding  

## Architecture
**Frontend:** Chrome Extension (Manifest V3)  
**AI Layer:** Chrome Built-in AI APIs (Prompt, Writer, Rewriter, Translator, Proofreader, Summarizer)  
**State Management:** Chrome Storage API  
**Audio:** Chrome TTS API  
**Scheduling:** Chrome Alarms API  

## Ethical and Accessibility Considerations
- WCAG-compliant color contrast and visual hierarchy  
- Optional audio toggle for low-vision users  
- Full local execution for privacy and transparency  
- No data collection or analytics  

## References
- American Optometric Association. (2023). *Computer Vision Syndrome (Digital Eye Strain).* Retrieved from [AOA.org](https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome)  
- *Contact Lens & Anterior Eye* (2024). Structured gaze breaks improve tear-film stability.  
- *Hot Towels: The Bedrock of Meibomian Gland Dysfunction Therapy* (2023).  
- *Evidence-Based Teaching in Contact Lenses Education* (2022).  
- Lavie, N., & Tsal, Y. (1994). *Perceptual load as a major determinant of selective attention.* *Psychological Science,* 5(3), 182–188.  
- Gorbatova, D., Wästlund, E., & Gustafsson, A. (2023). *Banner blindness revisited: Learned suppression of task-irrelevant visual elements.* *Computers in Human Behavior,* 141, 107648.  

## License
MIT
"""