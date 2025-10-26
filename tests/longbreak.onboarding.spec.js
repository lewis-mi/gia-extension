// ===== GIA LONG BREAK AND ONBOARDING TESTS =====

import { test, expect } from '@playwright/test';

test.describe('Long Break Functionality', () => {
  test('should trigger long break after configured interval', async ({ page }) => {
    // Set long break frequency
    await chrome.storage.local.set({ longBreakFrequency: 60 });
    
    // Wait for long break alarm
    await page.waitForTimeout(60 * 1000);
    
    // Verify long break card appears
    await expect(page.locator('#gia-break-card')).toBeVisible();
    
    // Verify duration is correct (default 10 min)
    const duration = page.locator('.gia-hero-count');
    await expect(duration).toContainText('10m');
  });

  test('should show long break activities', async () => {
    const activities = page.locator('.activities li');
    await expect(activities).toHaveCount(5);
  });

  test('should allow extending long break', async () => {
    await page.click('#extend');
    
    const countdown = page.locator('#countdown');
    // Should show 15 minutes after extending
    await expect(countdown).toContainText('15');
  });
});

test.describe('Onboarding Flow', () => {
  test('should open onboarding on first install', async ({ page, context }) => {
    // Simulate first install
    const extId = await chrome.tabs.create({
      url: chrome.runtime.getURL('ui/onboarding.html')
    });
    
    await expect(page).toHaveURL(/onboarding.html/);
  });

  test('should complete onboarding and start session', async ({ page }) => {
    // Navigate through onboarding steps
    await page.click('text=Next');
    await page.click('text=Next');
    await page.click('text=Get Started');
    
    // Verify session starts
    const { sessionStartTime } = await chrome.storage.local.get('sessionStartTime');
    expect(sessionStartTime).toBeDefined();
    
    // Verify alarms are created
    const alarms = await context.sendMessage({ type: 'CHECK_ALARMS' });
    expect(alarms.length).toBeGreaterThan(0);
  });
});

