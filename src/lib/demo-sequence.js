/**
 * @file Manages the multi-step demo sequence for the Gia extension.
 */

import { getSettings } from './settings-storage.js';

/**
 * Find the demo tab by querying all tabs
 * @returns {Promise<chrome.tabs.Tab|null>} The demo tab or null
 */
export async function findDemoTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find(tab => tab.url && (tab.url.includes('demo.html'))) || null;
}

/**
 * Executes a step in the demo sequence.
 */
export async function runDemoStep() {
  const { demoStep = 1 } = await chrome.storage.local.get('demoStep');
  const demoTab = await findDemoTab();

  console.log('Demo step:', demoStep, 'Demo tab found:', !!demoTab);
  if (demoTab) {
    console.log('Demo tab ID:', demoTab.id, 'URL:', demoTab.url);
  }

  if (!demoTab) {
    console.warn('Demo tab not found. Stopping demo sequence.');
    await chrome.storage.local.remove('demoStep');
    await chrome.alarms.clear('gia-demo');
    return;
  }

  switch (demoStep) {
    case 1:
      // Step 1: Mindful Short Break
      console.log('Running Demo Step 1: Mindful Short Break');
      console.log('Sending GIA_SHOW_BREAK message to tab', demoTab.id);
      try {
        await chrome.tabs.sendMessage(demoTab.id, {
          type: 'GIA_SHOW_BREAK',
          breakType: 'short',
          durationMs: 20000,
          tone: 'mindful',
        });
        console.log('Message sent successfully');
      } catch (e) {
        console.error('Failed to send message to tab:', e);
      }
      // Schedule next step
      // The first break is 20s long. We'll trigger the next step right after.
      // We use a new alarm name to avoid conflicts.
      await chrome.storage.local.set({ demoStep: 2 });
      // 25 seconds = 20s break + 5s buffer
      await chrome.alarms.create('gia-demo-step2', { delayInMinutes: 25 / 60 }); 
      break;

    case 2:
      // Step 2: Goofy Long Break
      console.log('Running Demo Step 2: Goofy Long Break');
      await chrome.tabs.sendMessage(demoTab.id, {
        type: 'GIA_SHOW_BREAK',
        breakType: 'long',
        durationMs: 30000, // As per README
        tone: 'goofy',
      });
      // End of demo
      await chrome.storage.local.remove('demoStep');
      await chrome.alarms.clearAll(); // Clear all demo-related alarms
      console.log('Demo sequence complete.');
      break;

    default:
      console.log('Unknown demo step. Ending demo.');
      await chrome.storage.local.remove('demoStep');
      await chrome.alarms.clear('gia-demo');
      break;
  }
}
