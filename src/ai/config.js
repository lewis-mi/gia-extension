// ===== HYBRID AI CONFIGURATION =====
// Combines local Gemini Nano processing with cloud AI for enhanced features

const HYBRID_AI_CONFIG = {
  // Local AI (Privacy-first)
  local: {
    enabled: true,
    apis: ['prompt', 'writer', 'rewriter', 'proofreader', 'summarizer', 'translator'],
    useFor: [
      'break_reminders',
      'voice_commands', 
      'reflection_cleaning',
      'basic_insights'
    ]
  },
  
  // Cloud AI (Enhanced features)
  cloud: {
    enabled: false, // User opt-in for enhanced features
    provider: 'firebase-ai', // or 'gemini-developer-api'
    useFor: [
      'advanced_analytics',
      'pattern_recognition',
      'personalized_recommendations',
      'wellness_trends',
      'team_insights'
    ],
    privacyLevel: 'anonymized' // No personal data, only aggregated insights
  }
};

// Firebase AI Logic configuration
const FIREBASE_CONFIG = {
  // Note: Replace with your actual Firebase config.
  // WARNING: Do not commit real API keys to version control.
  // Use environment variables or a secure secret management solution.
  apiKey: "demo-api-key", // Example: process.env.FIREBASE_API_KEY
  authDomain: "gia-extension-demo.firebaseapp.com",
  projectId: "gia-extension-demo",
  storageBucket: "gia-extension-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Gemini Developer API configuration
const GEMINI_CONFIG = {
  // WARNING: Do not commit real API keys to version control.
  // This should be a user-provided key managed securely.
  apiKey: "demo-gemini-key",
  model: "gemini-1.5-flash",
  safetySettings: {
    harassment: "BLOCK_MEDIUM_AND_ABOVE",
    hate_speech: "BLOCK_MEDIUM_AND_ABOVE",
    sexually_explicit: "BLOCK_MEDIUM_AND_ABOVE",
    dangerous_content: "BLOCK_MEDIUM_AND_ABOVE"
  }
};

export { HYBRID_AI_CONFIG, FIREBASE_CONFIG, GEMINI_CONFIG };
