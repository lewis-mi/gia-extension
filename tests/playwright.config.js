// ===== PLAYWRIGHT CONFIG FOR GIA EXTENSION =====

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-extensions-except=gia-extension',
            '--load-extension=gia-extension'
          ]
        }
      },
    },
  ],

  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});

