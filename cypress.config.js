// ===== CYPRESS CONFIG FOR GIA EXTENSION =====

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/chrome-stub.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
  },
  chromeWebSecurity: false,
});

