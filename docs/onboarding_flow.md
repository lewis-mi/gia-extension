# Gia Onboarding Flow

## Overview
The onboarding process guides users through Gia's features and sets up their first session.

## Steps

1. **Welcome Screen**
   - Introduction to Gia
   - Explanation of 20-20-20 rule
   - Get Started button

2. **Settings Setup**
   - Voice commands toggle
   - Hybrid AI toggle
   - Analytics preferences

3. **Session Start**
   - Initialize alarms
   - Set session start time
   - Begin icon progression

## Files

- `ui/onboarding.html` - Welcome screen
- `ui/onboarding.js` - Multi-step onboarding logic
- `background.js` - Session initialization

## User Flow

```
Install Extension
    ↓
Open Onboarding Page
    ↓
Welcome Screen (Step 1)
    ↓
Settings Configuration (Step 2)
    ↓
Tutorial/AI Features (Step 3)
    ↓
Complete Onboarding
    ↓
Start First Session
```

## Data Stored

- `onboardingComplete: true`
- `sessionStartTime: timestamp`
- `firstBreakToday: true`
- User preferences

