// ===== GIA PAUSE/RESUME/EXIT TESTS =====

import { test, expect } from '@playwright/test';

test.describe('Pause, Resume, and Exit Functionality', () => {
  test('should pause session', async ({ page, context }) => {
    // Load extension
    await page.goto('chrome://extensions');
    
    // Enable extension
    await page.click('[aria-label="Enable extension"]');
    
    // Wait for icon to appear
    await expect(page.locator('#gia-corner-logo')).toBeVisible();
    
    // Trigger pause
    await page.keyboard.press('F12'); // Open context menu
    await page.click('text=Pause Session');
    
    // Verify alarms are cleared
    const alarms = await context.sendMessage({ type: 'CHECK_ALARMS' });
    expect(alarms).toEqual([]);
  });

  test('should resume paused session', async ({ page }) => {
    // After pause, trigger resume
    await page.click('text=Resume Session');
    
    // Verify new alarms are created
    const alarms = await context.sendMessage({ type: 'CHECK_ALARMS' });
    expect(alarms.length).toBeGreaterThan(0);
  });

  test('should exit/cancel break', async ({ page }) => {
    // Trigger a break
    await chrome.runtime.sendMessage({ type: 'GIA_IMMEDIATE_BREAK' });
    
    // Verify break card appears
    await expect(page.locator('#gia-break-card')).toBeVisible();
    
    // Press ESC to dismiss
    await page.keyboard.press('Escape');
    
    // Verify break card is removed
    await expect(page.locator('#gia-break-card')).not.toBeVisible();
  });
});

