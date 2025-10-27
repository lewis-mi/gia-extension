// ===== AI-POWERED BREAK MESSAGE GENERATION =====
// Uses Chrome Built-in AI Writer API to create dynamic, personalized break reminders

/**
 * Generates a dynamic break reminder message using the Writer API
 * @param {string} tone - 'mindful' or 'goofy'
 * @param {number} elapsedMinutes - Minutes since last break
 * @returns {Promise<string>} Personalized break reminder message
 */
export async function generateBreakMessage(tone = 'mindful', elapsedMinutes = 20) {
  try {
    const ai = getChromeAI();
    const writer = ai?.writer;

    // Check if Writer API is available
    if (!writer) {
      return getDefaultMessage(tone);
    }

    const capabilities = await writer.capabilities();
    if (capabilities?.available !== 'readily') {
      return getDefaultMessage(tone);
    }

    // Get tone-specific prompt
    const tonePrompt = getTonePrompt(tone);

    // Create writer session
    const session = await writer.create({
      systemPrompt: tonePrompt
    });

    // Generate personalized message
    const message = await session.write(
      `Create a ${tone} reminder for a 20-second eye break. 
      User has been working for ${elapsedMinutes} minutes.
      Keep it brief (under 15 words). Be encouraging and specific.`
    );

    session.destroy();
    return message || getDefaultMessage(tone);
    
  } catch (e) {
    console.warn('Failed to generate AI message:', e);
    return getDefaultMessage(tone);
  }
}

/**
 * Gets the tone-specific system prompt for the Writer API
 */
function getTonePrompt(tone) {
  const prompts = {
    mindful: `You are a mindful wellness assistant. Create calm, grounding break reminders that encourage focus and breathing. Be gentle and soothing. Use mindfulness principles. Keep messages brief (under 15 words) and meaningful.`,
    
    goofy: `You are a playful wellness assistant. Create humorous break reminders with light-hearted jokes and puns. Make taking breaks fun and memorable. Stay positive and use gentle humor. Keep messages brief (under 15 words) and creative.`,
    
    motivating: `You are a motivational wellness assistant. Create energetic, encouraging break reminders that boost motivation. Use active language and inspire action. Keep messages dynamic and brief (under 15 words).`,
    
    friendly: `You are a warm wellness assistant. Create friendly break reminders with a casual, supportive tone. Be conversational and approachable. Keep messages brief (under 15 words) and personal.`
  };
  
  return prompts[tone] || prompts.mindful;
}

/**
 * Gets default fallback messages when AI is unavailable
 */
function getDefaultMessage(tone) {
  const messages = {
    mindful: "Take a deep breath and look 20 feet away for 20 seconds. Your eyes will thank you. 🧘‍♀️",
    goofy: "Time to give your peepers a break! Look far away and count to 20. One, two, twenty... go! 🤪",
    motivating: "You've got this! Stand up, look far, and come back stronger! 💪",
    friendly: "Hey! It's time for a quick eye stretch. Look 20 feet away and take 20 seconds. 😊"
  };
  
  return messages[tone] || messages.mindful;
}

/**
 * Re-writes a break message using the Rewriter API to adapt tone
 * @param {string} message - Original message
 * @param {string} targetTone - Target tone to adapt to
 * @returns {Promise<string>} Rewritten message in target tone
 */
export async function rewriteMessage(message, targetTone = 'mindful') {
  try {
    const ai = getChromeAI();
    const rewriter = ai?.rewriter;
    if (!rewriter) return message;

    const capabilities = await rewriter.capabilities();
    if (capabilities?.available !== 'readily') return message;

    const session = await rewriter.create({
      systemPrompt: `Adapt messages to be ${targetTone} and encouraging. Keep the core meaning.`
    });
    
    const rewritten = await session.rewrite(message);
    session.destroy();
    
    return rewritten || message;
    
  } catch (e) {
    console.warn('Failed to rewrite message:', e);
    return message;
  }
}

/**
 * Generates a multilingual break message using Translator API
 * @param {string} message - English message
 * @param {string} targetLang - Target language code (es, fr, de, etc.)
 * @returns {Promise<string>} Translated message
 */
export async function translateMessage(message, targetLang = 'es') {
  try {
    const ai = getChromeAI();
    const translator = ai?.translator;
    if (!translator || targetLang === 'en' || targetLang === 'auto') {
      return message;
    }

    const capabilities = await translator.capabilities();
    if (capabilities?.available !== 'readily') return message;

    const session = await translator.create({
      systemPrompt: 'Translate this message naturally while keeping the friendly tone.'
    });
    
    const translated = await session.translate(message);
    session.destroy();
    
    return translated || message;
    
  } catch (e) {
    console.warn('Failed to translate message:', e);
    return message;
  }
}

/**
 * Uses Proofreader API to clean user reflection text
 * @param {string} text - User reflection text
 * @returns {Promise<string>} Cleaned text
 */
export async function proofreadReflection(text) {
  try {
    const ai = getChromeAI();
    const proofreader = ai?.proofreader;
    if (!proofreader) return text;

    const capabilities = await proofreader.capabilities();
    if (capabilities?.available !== 'readily') return text;

    const session = await proofreader.create({
      systemPrompt: 'Clean up grammar and spelling while preserving the user\'s voice and meaning.'
    });
    
    const cleaned = await session.proofread(text);
    session.destroy();
    
    return cleaned || text;
    
  } catch (e) {
    console.warn('Failed to proofread:', e);
    return text;
  }
}

/**
 * Uses Summarizer API to generate insights from multiple reflections
 * @param {string[]} reflections - Array of reflection texts
 * @returns {Promise<string>} Summary of insights
 */
export async function summarizeReflections(reflections) {
  try {
    const ai = getChromeAI();
    const summarizer = ai?.summarizer;
    if (!summarizer || reflections.length < 3) return null;

    const capabilities = await summarizer.capabilities();
    if (capabilities?.available !== 'readily') return null;

    const session = await summarizer.create({
      systemPrompt: 'Identify key wellness patterns and insights from user reflections. Be encouraging.'
    });
    
    const combined = reflections.join('\n\n');
    const summary = await session.summarize(combined);
    session.destroy();
    
    return summary;

  } catch (e) {
    console.warn('Failed to summarize reflections:', e);
    return null;
  }
}

function getChromeAI() {
  if (typeof chrome === 'undefined') {
    return undefined;
  }

  return chrome.ai;
}

