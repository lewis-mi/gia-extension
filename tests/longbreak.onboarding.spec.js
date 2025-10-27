// ===== GIA BREAK MESSAGE GENERATION TESTS =====

import { test, expect } from '@playwright/test';
import {
  generateBreakMessage,
  rewriteMessage
} from '../ai/breakMessageGenerator.js';

const MINDFUL_FALLBACK =
  "Take a deep breath and look 20 feet away for 20 seconds. Your eyes will thank you. 🧘‍♀️";

const GOOFY_FALLBACK =
  "Time to give your peepers a break! Look far away and count to 20. One, two, twenty... go! 🤪";

test.describe('generateBreakMessage', () => {
  test.afterEach(() => {
    delete globalThis.chrome;
  });

  test('returns mindful fallback message when Writer API is unavailable', async () => {
    delete globalThis.chrome;

    const message = await generateBreakMessage('mindful', 24);

    expect(message).toBe(MINDFUL_FALLBACK);
  });

  test('returns tone-specific fallback message when Writer API missing', async () => {
    delete globalThis.chrome;

    const goofyMessage = await generateBreakMessage('goofy', 12);

    expect(goofyMessage).toBe(GOOFY_FALLBACK);
  });

  test('uses Writer API when available', async () => {
    const destroy = () => {};
    globalThis.chrome = {
      ai: {
        writer: {
          async capabilities() {
            return { available: 'readily' };
          },
          async create() {
            return {
              async write() {
                return 'Custom AI reminder';
              },
              destroy
            };
          }
        }
      }
    };

    const message = await generateBreakMessage('mindful', 20);

    expect(message).toBe('Custom AI reminder');
  });

  test('falls back when Writer API reports limited availability', async () => {
    globalThis.chrome = {
      ai: {
        writer: {
          async capabilities() {
            return { available: 'after-download' };
          }
        }
      }
    };

    const message = await generateBreakMessage('mindful', 18);

    expect(message).toBe(MINDFUL_FALLBACK);
  });
});

test.describe('rewriteMessage', () => {
  test.afterEach(() => {
    delete globalThis.chrome;
  });

  test('returns original message when Rewriter API missing', async () => {
    delete globalThis.chrome;

    const rewritten = await rewriteMessage('Original message', 'motivating');

    expect(rewritten).toBe('Original message');
  });

  test('returns rewritten message when API available', async () => {
    const destroy = () => {};
    globalThis.chrome = {
      ai: {
        rewriter: {
          async capabilities() {
            return { available: 'readily' };
          },
          async create() {
            return {
              async rewrite(message) {
                return `${message} (rewritten)`;
              },
              destroy
            };
          }
        }
      }
    };

    const rewritten = await rewriteMessage('Original message', 'motivating');

    expect(rewritten).toBe('Original message (rewritten)');
  });

  test('falls back to original when API availability is limited', async () => {
    globalThis.chrome = {
      ai: {
        rewriter: {
          async capabilities() {
            return { available: 'no' };
          }
        }
      }
    };

    const rewritten = await rewriteMessage('Original message', 'motivating');

    expect(rewritten).toBe('Original message');
  });
});
