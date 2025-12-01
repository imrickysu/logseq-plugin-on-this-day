/**
 * Test setup - runs before each test file
 */

// Import the mock
import { mockLogseq } from "./mocks/logseq.js";

// Make logseq available globally
global.logseq = mockLogseq;

// Helper to clear all mocks
const clearAllMocks = (obj) => {
  Object.values(obj).forEach(value => {
    if (value && typeof value === 'object') {
      if (typeof value.mockClear === 'function') {
        value.mockClear();
      } else {
        clearAllMocks(value);
      }
    }
  });
};

// Reset mocks before each test
beforeEach(() => {
  clearAllMocks(mockLogseq);

  // Reset settings to defaults
  mockLogseq.settings.startingYear = "2010";
  mockLogseq.settings.pageTitle = "On This Day";
  mockLogseq.settings.enableJump = false;
  mockLogseq.settings.jumpButtonPosition = "pagebar";
});
