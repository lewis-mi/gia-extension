// ===== GIA CYPRESS E2E TESTS =====

describe('Gia Extension E2E Tests', () => {
  beforeEach(() => {
    // Load extension
    cy.window().then((win) => {
      cy.stub(win.chrome.runtime, 'sendMessage').callsFake((msg) => {
        if (msg.type === 'GIA_GET_MESSAGE') {
          return Promise.resolve({ text: 'Look 20 feet away and soften your gaze.' });
        }
        return Promise.resolve({ success: true });
      });
    });
  });

  describe('Onboarding Flow', () => {
    it('should display onboarding on first install', () => {
      cy.visit('ui/onboarding.html');
      
      cy.contains('Welcome to Gia');
      cy.contains('Every 20 minutes');
      cy.get('button').contains('Get Started').should('exist');
    });

    it('should complete onboarding successfully', () => {
      cy.visit('ui/onboarding.html');
      
      cy.get('#skipBtn').should('exist');
      cy.get('button').contains('Get Started').click();
      
      // Verify onboarding flag is set
      cy.window().its('localStorage').should('have.property', 'onboardingComplete');
    });
  });

  describe('Long Break Flow', () => {
    it('should open long break page', () => {
      cy.visit('ui/longbreak.html');
      
      cy.contains('Take a Longer Break');
      cy.get('#countdown').should('contain', '10 minutes');
      cy.get('#activities').should('exist');
    });

    it('should countdown correctly', () => {
      cy.visit('ui/longbreak.html');
      
      // Wait 1 second and verify countdown updated
      cy.wait(1000);
      cy.get('#countdown').should(($el) => {
        const text = $el.text();
        expect(text).to.match(/\d+ minute/);
      });
    });

    it('should allow skipping break', () => {
      cy.visit('ui/longbreak.html');
      
      cy.get('#skip').click();
      
      // Verify message sent
      cy.window().then((win) => {
        expect(win.chrome.runtime.sendMessage).to.have.been.calledWith(
          { type: 'GIA_RESET' }
        );
      });
    });
  });

  describe('Resume Session', () => {
    it('should show session stats', () => {
      cy.window().then((win) => {
        win.chrome.storage.local.get.returns(
          Promise.resolve({ breakCount: 5, sessionStartTime: Date.now() })
        );
      });
      
      cy.visit('ui/resume.html');
      
      cy.contains('Welcome Back');
      cy.contains('Total Breaks Taken').should('exist');
    });

    it('should resume session', () => {
      cy.visit('ui/resume.html');
      
      cy.get('#resume').click();
      
      cy.window().then((win) => {
        expect(win.chrome.runtime.sendMessage).to.have.been.calledWith(
          { type: 'GIA_RESCHEDULE' }
        );
      });
    });
  });
});

