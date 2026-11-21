/// <reference types="vitest/jsdom" />

// Use the test document's storage even on Node versions with a Web Storage global.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: jsdom.window.localStorage
})
