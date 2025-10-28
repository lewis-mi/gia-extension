// Demo initialization script
// Load content script dynamically
(function() {
  console.log('Demo init script loaded');
  
  // Load content.js from extension root
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/content.js');
  script.onload = function() {
    console.log('Content script loaded successfully');
  };
  script.onerror = function() {
    console.error('Failed to load content script');
  };
  (document.head || document.documentElement).appendChild(script);
})();

