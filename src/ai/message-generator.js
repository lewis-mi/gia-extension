// ===== MESSAGE GENERATOR =====
// Generates break reminder messages based on tone and break type

const JOKES = [
  "Knock knock. Who's there? Boo. Boo who? Don't cry!",
  "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in!",
  "Knock knock. Who's there? Hawaii. Hawaii who? I'm fine, Hawaii you?",
  "Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!"
];

/**
 * Generate a break reminder message based on tone and break type
 * @param {string} tone - 'mindful' | 'goofy' | 'motivating'
 * @param {string} breakType - 'short' | 'long'
 * @returns {string} The message text
 */
export function generateBreakMessage(tone, breakType) {
  if (breakType === 'long') {
    // Long break messages
    if (tone === 'goofy') {
      return "Take 5. Time to touch grass but here's one for the road. Knock knock. Who's there? Cow says. Cow says who? No, a cow says moo!";
    } else {
      return "Take a longer break. Step away from your screen, stretch your arms, and let your eyes rest. I'll let you know when time is up.";
    }
  } else {
    // Short break messages
    if (tone === 'mindful') {
      return "Take a 20-second break. Look 20 feet away and blink gently. I'll let you know when time is up.";
    } else if (tone === 'goofy') {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
      return `Look 20 feet away and blink gently. ${joke} I'll let you know when time is up.`;
    } else {
      return "Take a 20-second break. Look 20 feet away and blink gently.";
    }
  }
}

