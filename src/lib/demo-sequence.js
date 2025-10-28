// ===== DEMO SEQUENCE MODULE =====
// Handles the demo mode break sequence

import { stopAllAudio } from './tts-handler.js';
import { setSettings as updateSettings } from './settings-storage.js';

let isDemoRunning = false;

/**
 * Start the demo sequence with a series of breaks
 * @param {number} tabId - The tab ID to show breaks on
 * @param {function} sendResponse - Callback to send response
 */
export async function startDemo(tabId, sendResponse) {
  if (isDemoRunning) {
    console.log('Demo already running, ignoring duplicate request');
    if (sendResponse) sendResponse({ error: 'Demo already running' });
    return;
  }
  
  isDemoRunning = true;

  try {
    // Set initial demo settings
    await updateSettings({
      audioEnabled: true,
      voiceCommandsEnabled: false,
      tipTone: 'mindful',
      onboardingComplete: true,
      paused: false,
    });

    // --- Sequence Start ---

    // 1. Mindful Break (after a short delay)
    console.log('Demo: Triggering Mindful break...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to be ready
    
    // Stop any existing audio
    stopAllAudio();
    
    await chrome.tabs.sendMessage(tabId, {
      type: 'GIA_SHOW_BREAK',
      breakType: 'short',
      durationMs: 20000,
      tone: 'mindful'
    });

    // 2. Long Break with Goofy tone (after the first one finishes)
    console.log('Demo: Scheduling Long break...');
    await new Promise(resolve => setTimeout(resolve, 22000)); // 20s break + 2s buffer
    
    // Explicitly dismiss previous card and stop audio
    try { chrome.tts.stop(); } catch (e) {}
    await chrome.tabs.sendMessage(tabId, { type: 'GIA_DISMISS_BREAK' }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for dismiss animation
    
    await updateSettings({ tipTone: 'goofy' });
    await new Promise(resolve => setTimeout(resolve, 500));
    await chrome.tabs.sendMessage(tabId, {
      type: 'GIA_SHOW_BREAK',
      breakType: 'long',
      durationMs: 30000, // 30 seconds for demo purposes
      tone: 'goofy'
    });

    // --- Sequence End ---
    console.log('Demo sequence complete.');
    if (sendResponse) sendResponse({ success: true });

    // Reset demo flag after sequence (20s mindful + 30s goofy long)
    const totalDemoTime = 22000 + 32000;
    setTimeout(() => { isDemoRunning = false; }, totalDemoTime);

  } catch (e) {
    console.error('Demo start error:', e);
    isDemoRunning = false;
    if (sendResponse) sendResponse({ error: e.message });
  }
}

/**
 * Find the demo tab by querying all tabs
 * @returns {Promise<object|null>} The demo tab or null
 */
export async function findDemoTab() {
  const allTabs = await chrome.tabs.query({});
  const demoTab = allTabs.find(tab => tab.url && tab.url.includes('demo.html'));
  
  if (!demoTab) {
    console.error('Demo tab not found');
    return null;
  }
  
  console.log(`Found demo tab ID: ${demoTab.id}`);
  return demoTab;
}

