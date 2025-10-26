// ===== CYPRESS CHROME API STUBS =====
// Stub Chrome extension APIs for Cypress testing

beforeEach(() => {
  cy.window().then((win) => {
    // Stub chrome.runtime
    win.chrome = {
      runtime: {
        sendMessage: cy.stub().resolves({ success: true }),
        getURL: (path) => `chrome-extension://test-id/${path}`,
        id: 'test-id',
        onMessage: {
          addListener: cy.stub(),
          removeListener: cy.stub(),
        },
        onInstalled: {
          addListener: cy.stub(),
        },
        onStartup: {
          addListener: cy.stub(),
        }
      },
      
      // Stub chrome.storage
      storage: {
        local: {
          get: cy.stub().resolves({}),
          set: cy.stub().resolves(),
          remove: cy.stub().resolves(),
          clear: cy.stub().resolves()
        },
        sync: {
          get: cy.stub().resolves({}),
          set: cy.stub().resolves()
        }
      },
      
      // Stub chrome.alarms
      alarms: {
        create: cy.stub().resolves(),
        clear: cy.stub().resolves(),
        clearAll: cy.stub().resolves(),
        get: cy.stub().resolves({}),
        getAll: cy.stub().resolves([]),
        onAlarm: {
          addListener: cy.stub()
        }
      },
      
      // Stub chrome.tabs
      tabs: {
        query: cy.stub().resolves([{ id: 1, url: 'http://example.com' }]),
        sendMessage: cy.stub().resolves(),
        captureVisibleTab: cy.stub().resolves('data:image/png;base64,...'),
        create: cy.stub().resolves({ id: 1 })
      },
      
      // Stub chrome.action
      action: {
        setIcon: cy.stub().resolves(),
        openPopup: cy.stub().resolves(),
        setTitle: cy.stub().resolves()
      },
      
      // Stub chrome.tts
      tts: {
        speak: cy.stub().resolves(),
        stop: cy.stub().resolves(),
        pause: cy.stub().resolves(),
        resume: cy.stub().resolves(),
        getVoices: cy.stub().resolves([])
      },
      
      // Stub chrome.ai (Built-in AI)
      ai: {
        prompt: {
          capabilities: cy.stub().resolves({ available: 'readily' }),
          create: cy.stub().resolves({
            prompt: cy.stub().resolves('AI response'),
            destroy: cy.stub().resolves()
          })
        },
        writer: {
          capabilities: cy.stub().resolves({ available: 'readily' }),
          create: cy.stub().resolves({
            write: cy.stub().resolves('Written content'),
            destroy: cy.stub().resolves()
          })
        },
        rewriter: {
          capabilities: cy.stub().resolves({ available: 'readily' }),
          create: cy.stub().resolves({
            rewrite: cy.stub().resolves('Rewritten content'),
            destroy: cy.stub().resolves()
          })
        },
        translator: {
          capabilities: cy.stub().resolves({ 
            available: 'readily',
            languagePairAvailable: cy.stub().resolves('readily')
          }),
          create: cy.stub().resolves({
            translate: cy.stub().resolves('Translated text'),
            destroy: cy.stub().resolves()
          })
        },
        proofreader: {
          capabilities: cy.stub().resolves({ available: 'readily' }),
          create: cy.stub().resolves({
            proofread: cy.stub().resolves('Proofread text'),
            destroy: cy.stub().resolves()
          })
        },
        summarizer: {
          capabilities: cy.stub().resolves({ available: 'readily' }),
          create: cy.stub().resolves({
            summarize: cy.stub().resolves('Summary'),
            destroy: cy.stub().resolves()
          })
        }
      }
    };
  });
});

