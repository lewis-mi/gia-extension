const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  // Tell Cypress to serve files from the repo root
  fileServerFolder: '.',
  e2e: {
    // Remove/omit baseUrl so we can cy.visit('ui/...html')
    supportFile: 'cypress/support/e2e.js',
  },
});
