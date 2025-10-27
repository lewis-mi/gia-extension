// ===== GIA TRANSLATION AND REFLECTION TESTS =====

import { test, expect } from '@playwright/test';
import {
  translateMessage,
  proofreadReflection,
  summarizeReflections
} from '../ai/breakMessageGenerator.js';

const SAMPLE_MESSAGE = 'Look 20 feet away and rest your eyes for 20 seconds.';

const createChromeStub = (overrides = {}) => ({
  ai: {
    translator: {
      async capabilities() {
        return { available: 'readily' };
      },
      async create() {
        return {
          async translate(message) {
            return `translated:${message}`;
          },
          destroy() {}
        };
      },
      ...overrides.translator
    },
    proofreader: {
      async capabilities() {
        return { available: 'readily' };
      },
      async create() {
        return {
          async proofread(text) {
            return `clean:${text}`;
          },
          destroy() {}
        };
      },
      ...overrides.proofreader
    },
    summarizer: {
      async capabilities() {
        return { available: 'readily' };
      },
      async create() {
        return {
          async summarize(text) {
            return `summary:${text.length}`;
          },
          destroy() {}
        };
      },
      ...overrides.summarizer
    }
  }
});

test.describe('translateMessage', () => {
  test.afterEach(() => {
    delete globalThis.chrome;
  });

  test('returns original message when translator missing', async () => {
    delete globalThis.chrome;

    const translated = await translateMessage(SAMPLE_MESSAGE, 'es');

    expect(translated).toBe(SAMPLE_MESSAGE);
  });

  test('returns original message when target language is English', async () => {
    globalThis.chrome = createChromeStub();

    const translated = await translateMessage(SAMPLE_MESSAGE, 'en');

    expect(translated).toBe(SAMPLE_MESSAGE);
  });

  test('returns translated message when API available', async () => {
    globalThis.chrome = createChromeStub();

    const translated = await translateMessage(SAMPLE_MESSAGE, 'es');

    expect(translated).toBe(`translated:${SAMPLE_MESSAGE}`);
  });

  test('falls back when translator availability is limited', async () => {
    globalThis.chrome = createChromeStub({
      translator: {
        async capabilities() {
          return { available: 'after-download' };
        }
      }
    });

    const translated = await translateMessage(SAMPLE_MESSAGE, 'es');

    expect(translated).toBe(SAMPLE_MESSAGE);
  });
});

test.describe('proofreadReflection', () => {
  test.afterEach(() => {
    delete globalThis.chrome;
  });

  test('returns original text when proofreader missing', async () => {
    delete globalThis.chrome;

    const cleaned = await proofreadReflection('i feel good');

    expect(cleaned).toBe('i feel good');
  });

  test('returns proofread text when API available', async () => {
    globalThis.chrome = createChromeStub();

    const cleaned = await proofreadReflection('i feel good');

    expect(cleaned).toBe('clean:i feel good');
  });

  test('falls back when proofreader availability is limited', async () => {
    globalThis.chrome = createChromeStub({
      proofreader: {
        async capabilities() {
          return { available: 'no' };
        }
      }
    });

    const cleaned = await proofreadReflection('i feel good');

    expect(cleaned).toBe('i feel good');
  });
});

test.describe('summarizeReflections', () => {
  test.afterEach(() => {
    delete globalThis.chrome;
  });

  test('returns null when not enough reflections provided', async () => {
    delete globalThis.chrome;

    const summary = await summarizeReflections(['one', 'two']);

    expect(summary).toBeNull();
  });

  test('uses summarizer API when available', async () => {
    globalThis.chrome = createChromeStub();

    const summary = await summarizeReflections(['first', 'second', 'third']);

    expect(summary).toBeDefined();
    expect(summary?.startsWith('summary:')).toBeTruthy();
  });

  test('returns null when summarizer availability is limited', async () => {
    globalThis.chrome = createChromeStub({
      summarizer: {
        async capabilities() {
          return { available: 'no' };
        }
      }
    });

    const summary = await summarizeReflections(['a', 'b', 'c']);

    expect(summary).toBeNull();
  });
});
