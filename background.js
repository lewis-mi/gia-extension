// ===== GIA BACKGROUND SERVICE WORKER =====
// Handles scheduling, AI generation, audio, and state management

// ===== CONFIG =====
const SHORT_BREAK_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes (fixed)
const SHORT_BREAK_DURATION_MS = 20 * 1000;      // 20 seconds
const DEFAULT_SNOOZE_MIN = 5;
const ICON_STAGES = 5; // 5 stages of progression

// ===== HYBRID AI CONFIG =====
const HYBRID_AI_CONFIG = {
  cloudEnabled: false,
  analyticsEnabled: false,
  userOptedIn: false
};

// Icon paths for 5-stage progression
const ICONS = [
  { 16: "assets/icons/icon_0_start.png", 32: "assets/icons/icon_0_start_32.png" },
  { 16: "assets/icons/icon_1_step.png", 32: "assets/icons/icon_1_step_32.png" },
  { 16: "assets/icons/icon_2_step.png", 32: "assets/icons/icon_2_step_32.png" },
  { 16: "assets/icons/icon_3_step.png", 32: "assets/icons/icon_3_step_32.png" },
  { 16: "assets/icons/icon_4_break.png", 32: "assets/icons/icon_4_break_32.png" }
];

// ===== HELPERS =====
function minsToMs(m) { return m * 60 * 1000; }
function isEligible(tab) { return /^https?:\/\//.test(tab?.url || ""); }

async function setIcon(stage) {
  try {
    const iconIndex = Math.min(stage, ICON_STAGES - 1);
    await chrome.action.setIcon({ path: ICONS[iconIndex] });
  } catch (e) {
    console.warn('Failed to set icon:', e);
  }
}

async function getSettings() {
  const defaults = {
    sessionMinutes: 60,
    shortEnabled: true,
    longEnabled: true,
    longBreakFrequency: 60,
    longBreakDuration: 10,
    voiceEnabled: false,
    audioEnabled: true,
    tonePreference: 'mindful',
    showCornerLogo: true,
    snoozeDuration: 5,
    sessionStartTime: null,
    breakCount: 0,
    firstBreakToday: true
  };

  const settings = await chrome.storage.local.get(Object.keys(defaults));
  return { ...defaults, ...settings };
}

// ===== SCHEDULING =====
async function scheduleAll() {
  await chrome.alarms.clearAll();
  await setIcon(0);

  const { sessionMinutes, longEnabled, longBreakFrequency } = await getSettings();

  // Schedule 5 icon progression stages over 20 minutes
  const stageInterval = SHORT_BREAK_INTERVAL_MS / ICON_STAGES;
  for (let i = 1; i < ICON_STAGES; i++) {
    chrome.alarms.create(`gia-stage-${i}`, {
      when: Date.now() + stageInterval * i
    });
  }

  // Schedule short break at 20 min
  chrome.alarms.create('gia-short-break', {
    when: Date.now() + SHORT_BREAK_INTERVAL_MS
  });

  // Schedule long break if enabled
  if (longEnabled) {
    chrome.alarms.create('gia-long-break', {
      when: Date.now() + minsToMs(longBreakFrequency)
    });
  }
}

// ===== BREAK TRIGGERING =====
async function sendBreak(type, durationMs) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let tab = tabs.find(isEligible);

  if (!tab) {
    const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
    tab = allTabs.find(isEligible);
  }

  if (!tab?.id) return false;

  chrome.tabs.sendMessage(
    tab.id,
    { type: "GIA_SHOW_BREAK", breakType: type, durationMs },
    () => void chrome.runtime.lastError
  );

  return true;
}

// ===== AUDIO =====
async function playBreakAudio(isFirstBreak) {
  const { audioEnabled } = await getSettings();
  if (!audioEnabled) return;

  if (isFirstBreak) {
    // Voice TTS for first break
    await playVoiceGuidance();
  } else {
    // Meditation bell for other breaks
    await playMeditationBell();
  }
}

async function playVoiceGuidance() {
  try {
    const text = "Time for your first break. Every 20 minutes, look 20 feet away for 20 seconds. This helps prevent eye strain and keeps your vision healthy.";
    
    chrome.tts.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    });
  } catch (e) {
    console.warn('TTS failed:', e);
  }
}

async function playMeditationBell() {
  try {
    // Play gentle notification sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

// ===== AI GENERATION =====
async function generateBreakMessage(locale = "en", tone = "mindful") {
  let text = "Look 20 feet away and soften your gaze.";

  try {
    const { tonePreference } = await getSettings();
    tone = tone || tonePreference;

    // Tone-specific system prompts
    const tonePrompts = {
      mindful: "You create calm, peaceful break reminders focused on mindfulness and relaxation.",
      motivating: "You create energetic, encouraging break reminders that boost motivation.",
      professional: "You create concise, professional break reminders for workplace wellness.",
      friendly: "You create warm, friendly break reminders with a casual, supportive tone."
    };

    const systemPrompt = tonePrompts[tone] || tonePrompts.mindful;

    // 1) Prompt API
    if (chrome?.ai?.prompt) {
      const capabilities = await chrome.ai.prompt.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const session = await chrome.ai.prompt.create({ systemPrompt });
          const result = await session.prompt(
            "Create one sentence (under 90 characters) encouraging a 20-second eye break. No emojis."
          );
          if (result) text = result.trim();
          session.destroy();
        } catch (e) {
          console.warn("Prompt API failed:", e);
        }
      }
    }

    // 2) Writer API (occasionally add wellness tip)
    if (Math.random() < 0.15 && chrome?.ai?.writer) {
      const capabilities = await chrome.ai.writer.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const writer = await chrome.ai.writer.create({
            tone: 'casual',
            length: 'short'
          });
          const tip = await writer.write(
            "Write one actionable tip about eye health or desk ergonomics for computer users. Under 80 characters."
          );
          if (tip) text = tip.trim();
          writer.destroy();
        } catch (e) {
          console.warn("Writer API failed:", e);
        }
      }
    }

    // 3) Rewriter API
    if (chrome?.ai?.rewriter) {
      const capabilities = await chrome.ai.rewriter.capabilities();
      if (capabilities?.available === 'readily') {
        try {
          const rewriterTone = tone === 'motivating' ? 'more-formal' : 'more-casual';
          const rewriter = await chrome.ai.rewriter.create({
            tone: rewriterTone,
            length: 'shorter'
          });
          const rewritten = await rewriter.rewrite(text);
          if (rewritten && rewritten.length <= 90) {
            text = rewritten.trim();
          }
          rewriter.destroy();
        } catch (e) {
          console.warn("Rewriter API failed:", e);
        }
      }
    }

    // 4) Translator API
    const lang = (locale || "en").split("-")[0].toLowerCase();
    if (lang !== 'en' && chrome?.ai?.translator) {
      const capabilities = await chrome.ai.translator.capabilities();
      const langPair = capabilities?.languagePairAvailable('en', lang);
      if (langPair === 'readily') {
        try {
          const translator = await chrome.ai.translator.create({
            sourceLanguage: 'en',
            targetLanguage: lang
          });
          const translated = await translator.translate(text);
          if (translated) text = translated.trim();
          translator.destroy();
        } catch (e) {
          console.warn("Translator API failed:", e);
        }
      }
    }

  } catch (e) {
    console.error("AI generation error:", e);
  }

  return text;
}

// ===== MULTIMODAL AI PROCESSING =====
async function processMultimodalInput(audioText, context) {
  try {
    if (!chrome?.ai?.prompt) {
      return { action: 'dismiss', message: 'AI processing unavailable' };
    }

    const capabilities = await chrome.ai.prompt.capabilities();
    if (capabilities?.available !== 'readily') {
      return { action: 'dismiss', message: 'AI processing unavailable' };
    }

    const session = await chrome.ai.prompt.create({
      systemPrompt: `You are Gia, a mindful break assistant. Process voice commands for break interactions. 
      Available actions: dismiss, snooze (with duration), start. 
      Respond with JSON: {"action": "action_name", "duration": minutes, "message": "response_text"}`
    });

    const result = await session.prompt(
      `Voice command: "${audioText}"\nContext: ${context}\nRespond with JSON only.`
    );

    session.destroy();

    try {
      const response = JSON.parse(result || '{}');
      return response;
    } catch (e) {
      // Fallback to basic intent recognition
      const basicAction = basicIntent(audioText);
      return { action: basicAction, message: 'Command processed' };
    }
  } catch (e) {
    console.error('Multimodal processing error:', e);
    return { action: 'dismiss', message: 'Processing failed' };
  }
}

async function analyzeScreenImage(imageData) {
  try {
    if (!chrome?.ai?.prompt) {
      return 'AI analysis unavailable';
    }

    const capabilities = await chrome.ai.prompt.capabilities();
    if (capabilities?.available !== 'readily') {
      return 'AI analysis unavailable';
    }

    const session = await chrome.ai.prompt.create({
      systemPrompt: `You are an eye health specialist. Analyze screen content for potential eye strain factors:
      - Text density and contrast
      - Bright colors or harsh lighting
      - Small text or cramped layouts
      - Blue light exposure indicators
      Provide brief, actionable advice for the user's eye health.`
    });

    // Note: This is a placeholder - actual image analysis would require image input
    const result = await session.prompt(
      'Analyze this screen capture for eye strain factors and provide brief health advice.'
    );

    session.destroy();
    return result || 'Screen appears normal for eye health.';
  } catch (e) {
    console.error('Screen analysis error:', e);
    return 'Unable to analyze screen content.';
  }
}

async function saveReflection(reflectionText) {
  try {
    const { reflections = [], breakCount } = await chrome.storage.local.get(['reflections', 'breakCount']);
    
    // Use AI to clean and enhance the reflection
    let cleanedReflection = reflectionText;
    if (chrome?.ai?.proofreader) {
      try {
        const capabilities = await chrome.ai.proofreader.capabilities();
        if (capabilities?.available === 'readily') {
          const proofreader = await chrome.ai.proofreader.create();
          cleanedReflection = await proofreader.proofread(reflectionText);
          proofreader.destroy();
        }
      } catch (e) {
        console.warn('Proofreader failed:', e);
      }
    }
    
    const newReflection = {
      id: Date.now(),
      text: cleanedReflection,
      original: reflectionText,
      timestamp: new Date().toISOString(),
      breakCount: breakCount || 0
    };
    
    reflections.push(newReflection);
    // Keep only last 50 reflections
    const trimmed = reflections.slice(-50);
    
    await chrome.storage.local.set({ reflections: trimmed });
    
    // Generate summary if we have enough reflections
    if (trimmed.length >= 5) {
      await generateReflectionSummary(trimmed.slice(-10));
    }
    
    return true;
  } catch (e) {
    console.error('Failed to save reflection:', e);
    throw e;
  }
}

async function generateReflectionSummary(recentReflections) {
  try {
    if (!chrome?.ai?.summarizer || recentReflections.length < 3) return;
    
    const capabilities = await chrome.ai.summarizer.capabilities();
    if (capabilities?.available !== 'readily') return;
    
    const reflectionTexts = recentReflections.map(r => r.text).join('\n');
    
    const summarizer = await chrome.ai.summarizer.create({
      summaryLength: 'brief'
    });
    
    const summary = await summarizer.summarize(reflectionTexts);
    summarizer.destroy();
    
    if (summary) {
      await chrome.storage.local.set({ 
        lastReflectionSummary: summary,
        summaryDate: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('Failed to generate reflection summary:', e);
  }
}

// ===== HYBRID AI FUNCTIONS =====
async function initializeHybridAI() {
  const { hybridAIEnabled = false, analyticsEnabled = false } = await chrome.storage.local.get(['hybridAIEnabled', 'analyticsEnabled']);
  HYBRID_AI_CONFIG.cloudEnabled = hybridAIEnabled;
  HYBRID_AI_CONFIG.analyticsEnabled = analyticsEnabled;
  HYBRID_AI_CONFIG.userOptedIn = hybridAIEnabled || analyticsEnabled;
}

async function processWithHybridAI(data, type) {
  try {
    // Always start with local AI processing
    const localResult = await processWithLocalAI(data, type);
    
    // If cloud AI is enabled and user opted in, enhance with cloud processing
    if (HYBRID_AI_CONFIG.cloudEnabled && HYBRID_AI_CONFIG.userOptedIn) {
      const cloudResult = await processWithCloudAI(data, type, localResult);
      return { ...localResult, ...cloudResult, hybrid: true };
    }
    
    return { ...localResult, hybrid: false };
  } catch (e) {
    console.error('Hybrid AI processing failed:', e);
    return { error: 'Processing failed', hybrid: false };
  }
}

async function processWithLocalAI(data, type) {
  // Use existing local AI functions
  switch (type) {
    case 'break_message':
      return { message: await generateBreakMessage() };
    case 'voice_command':
      return await processMultimodalInput(data.audio, data.context);
    case 'reflection':
      return await saveReflection(data.text);
    default:
      return { result: 'Local processing complete' };
  }
}

async function processWithCloudAI(data, type, localResult) {
  // Simulate cloud AI processing (replace with actual Firebase AI Logic or Gemini API)
  try {
    const cloudEnhancements = await simulateCloudAI(data, type, localResult);
    
    // Send anonymized analytics if enabled
    if (HYBRID_AI_CONFIG.analyticsEnabled) {
      await sendAnalytics(data, type, cloudEnhancements);
    }
    
    return cloudEnhancements;
  } catch (e) {
    console.warn('Cloud AI processing failed, using local result:', e);
    return {};
  }
}

async function simulateCloudAI(data, type, localResult) {
  // Simulate enhanced cloud AI processing
  // In a real implementation, this would call Firebase AI Logic or Gemini Developer API
  
  const enhancements = {
    advanced_insights: null,
    personalized_recommendations: null,
    wellness_trends: null,
    team_insights: null
  };
  
  switch (type) {
    case 'break_message':
      enhancements.advanced_insights = 'Enhanced break recommendations based on your wellness patterns';
      enhancements.personalized_recommendations = 'Consider adjusting your break timing based on your focus patterns';
      break;
      
    case 'reflection':
      enhancements.wellness_trends = 'Your reflection patterns show improved mindfulness over time';
      enhancements.personalized_recommendations = 'Try incorporating breathing exercises during breaks';
      break;
      
    case 'analytics':
      enhancements.team_insights = 'Your wellness score is above average compared to similar users';
      enhancements.wellness_trends = 'Peak productivity occurs 2 hours after your first break';
      break;
  }
  
  return enhancements;
}

async function sendAnalytics(data, type, enhancements) {
  // Send anonymized analytics to cloud service
  try {
    const analyticsData = {
      timestamp: Date.now(),
      type: type,
      enhancements: Object.keys(enhancements).length,
      // No personal data - only aggregated metrics
      metrics: {
        break_count: data.breakCount || 0,
        feature_usage: type,
        processing_time: Date.now() - data.startTime
      }
    };
    
    // In real implementation, send to Firebase Analytics or similar
    console.log('Analytics sent:', analyticsData);
    
    // Store locally for user transparency
    const { analytics = [] } = await chrome.storage.local.get('analytics');
    analytics.push(analyticsData);
    await chrome.storage.local.set({ analytics: analytics.slice(-100) }); // Keep last 100 entries
  } catch (e) {
    console.warn('Analytics failed:', e);
  }
}

async function generateAdvancedInsights() {
  // Generate advanced insights using cloud AI
  if (!HYBRID_AI_CONFIG.cloudEnabled) {
    return { insights: 'Enable hybrid AI for advanced insights' };
  }
  
  try {
    const { reflections = [], breakCount = 0 } = await chrome.storage.local.get(['reflections', 'breakCount']);
    
    const insights = await simulateCloudAI({
      reflections,
      breakCount,
      startTime: Date.now()
    }, 'analytics', {});
    
    return insights;
  } catch (e) {
    console.error('Advanced insights failed:', e);
    return { insights: 'Unable to generate insights' };
  }
}

function basicIntent(text) {
  const t = (text || '').toLowerCase();
  if (/\b(dismiss|close|stop|cancel|end)\b/.test(t)) return 'dismiss';
  if (/\b(snooze|later|remind me|wait)\b/.test(t)) return 'snooze';
  return 'start';
}

// ===== ALARM HANDLER =====
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const name = alarm?.name || '';

  // Icon progression stages
  if (name.startsWith('gia-stage-')) {
    const stage = parseInt(name.split('-')[2], 10);
    await setIcon(stage);
    return;
  }

  // Short break
  if (name === 'gia-short-break') {
    const { firstBreakToday, breakCount } = await getSettings();
    
    await setIcon(4); // Final green icon
    await sendBreak('short', SHORT_BREAK_DURATION_MS);
    await playBreakAudio(firstBreakToday);

    // Update break count and first break flag
    await chrome.storage.local.set({
      breakCount: breakCount + 1,
      firstBreakToday: false
    });

    // Schedule reset after break
    chrome.alarms.create('gia-reset', {
      when: Date.now() + SHORT_BREAK_DURATION_MS
    });
    return;
  }

  // Long break
  if (name === 'gia-long-break') {
    const { longBreakDuration } = await getSettings();
    const longMs = minsToMs(longBreakDuration);

    await setIcon(4);
    await sendBreak('long', longMs);
    await playMeditationBell();

    chrome.alarms.create('gia-reset', {
      when: Date.now() + longMs
    });
    return;
  }

  // Snooze end
  if (name === 'gia-snooze-end') {
    await setIcon(4);
    await sendBreak('short', SHORT_BREAK_DURATION_MS);
    await playMeditationBell();

    chrome.alarms.create('gia-reset', {
      when: Date.now() + SHORT_BREAK_DURATION_MS
    });
    return;
  }

  // Reset after break
  if (name === 'gia-reset') {
    await setIcon(0);
    await scheduleAll();
  }
});

// ===== MESSAGE HANDLERS =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  // Reschedule
  if (msg?.type === 'GIA_RESCHEDULE') {
    scheduleAll();
    return;
  }

  // Immediate break
  if (msg?.type === 'GIA_IMMEDIATE_BREAK') {
    (async () => {
      await setIcon(4);
      await sendBreak('short', SHORT_BREAK_DURATION_MS);
      chrome.alarms.create('gia-reset', {
        when: Date.now() + SHORT_BREAK_DURATION_MS
      });
    })();
    return;
  }

  // Snooze
  if (msg?.type === 'GIA_SNOOZE') {
    (async () => {
      const { snoozeDuration } = await getSettings();
      const snoozeMin = msg.minutes || snoozeDuration;
      chrome.alarms.create('gia-snooze-end', {
        when: Date.now() + minsToMs(snoozeMin)
      });
    })();
    return;
  }

  // Pause session
  if (msg?.type === 'GIA_PAUSE') {
    chrome.alarms.clearAll();
    setIcon(0);
    return;
  }

  // Disable for duration
  if (msg?.type === 'GIA_DISABLE_TEMP') {
    (async () => {
      const hours = msg.hours || 1;
      await chrome.alarms.clearAll();
      await setIcon(0);
      
      chrome.alarms.create('gia-resume', {
        when: Date.now() + hours * 60 * 60 * 1000
      });
    })();
    return;
  }

  // Generate AI message
  if (msg?.type === 'GIA_GET_MESSAGE') {
    generateBreakMessage(msg.locale, msg.tone)
      .then(text => sendResponse({ text }))
      .catch(err => {
        console.error('Message generation failed:', err);
        sendResponse({ text: "Look 20 feet away and soften your gaze." });
      });
    return true;
  }

  // Multimodal processing
  if (msg?.type === 'GIA_MULTIMODAL_PROCESS') {
    processMultimodalInput(msg.audio, msg.context)
      .then(response => sendResponse(response))
      .catch(err => {
        console.error('Multimodal processing failed:', err);
        sendResponse({ action: 'dismiss', message: 'Processing failed' });
      });
    return true;
  }

  // Screen analysis
  if (msg?.type === 'GIA_ANALYZE_SCREEN') {
    analyzeScreenImage(msg.imageData)
      .then(analysis => sendResponse({ analysis }))
      .catch(err => {
        console.error('Screen analysis failed:', err);
        sendResponse({ analysis: 'Unable to analyze screen content' });
      });
    return true;
  }

  // Save reflection
  if (msg?.type === 'GIA_SAVE_REFLECTION') {
    saveReflection(msg.reflection)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error('Failed to save reflection:', err);
        sendResponse({ success: false });
      });
    return true;
  }

  // Hybrid AI processing
  if (msg?.type === 'GIA_HYBRID_AI_PROCESS') {
    processWithHybridAI(msg.data, msg.processType)
      .then(result => sendResponse(result))
      .catch(err => {
        console.error('Hybrid AI processing failed:', err);
        sendResponse({ error: 'Processing failed' });
      });
    return true;
  }

  // Advanced insights
  if (msg?.type === 'GIA_ADVANCED_INSIGHTS') {
    generateAdvancedInsights()
      .then(insights => sendResponse(insights))
      .catch(err => {
        console.error('Advanced insights failed:', err);
        sendResponse({ insights: 'Unable to generate insights' });
      });
    return true;
  }

  // Hybrid AI settings
  if (msg?.type === 'GIA_TOGGLE_HYBRID_AI') {
    await chrome.storage.local.set({ 
      hybridAIEnabled: msg.enabled,
      analyticsEnabled: msg.analytics || false
    });
    await initializeHybridAI();
    sendResponse({ success: true });
    return true;
  }
});

// ===== INITIALIZATION =====
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - open onboarding
    await chrome.tabs.create({
      url: chrome.runtime.getURL('ui/onboarding.html')
    });
  } else {
    // Update or reload - start session
    await scheduleAll();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  // Initialize hybrid AI
  await initializeHybridAI();
  
  // Reset first break flag on new day
  const { sessionStartTime } = await chrome.storage.local.get('sessionStartTime');
  const now = Date.now();
  const lastDate = sessionStartTime ? new Date(sessionStartTime).toDateString() : null;
  const today = new Date(now).toDateString();

  if (lastDate !== today) {
    await chrome.storage.local.set({
      breakCount: 0,
      firstBreakToday: true,
      sessionStartTime: now
    });
  }

  await scheduleAll();
});