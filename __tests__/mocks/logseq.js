/**
 * Mock implementation of Logseq API for testing
 */

// Create mock functions manually
const createMockFn = () => {
  const fn = function(...args) {
    fn.calls.push(args);
    return fn.returnValue;
  };
  fn.calls = [];
  fn.returnValue = undefined;
  fn.mockReturnValue = (value) => {
    fn.returnValue = value;
    return fn;
  };
  fn.mockClear = () => {
    fn.calls = [];
  };
  return fn;
};

export const mockSettings = {
  startingYear: "2010",
  pageTitle: "On This Day",
  enableJump: false,
  jumpButtonPosition: "pagebar"
};

export const mockLogseq = {
  settings: mockSettings,

  useSettingsSchema: createMockFn(),

  App: {
    showMsg: createMockFn(),
    pushState: createMockFn(),
    registerUIItem: createMockFn(),
  },

  Editor: {
    createPage: createMockFn(),
    getCurrentPage: createMockFn(),
    getCurrentPageBlocksTree: createMockFn(),
    appendBlockInPage: createMockFn(),
    removeBlock: createMockFn(),
    exitEditingMode: createMockFn(),
    scrollToBlockInPage: createMockFn(),
  },

  DB: {
    datascriptQuery: createMockFn(),
  },

  provideModel: createMockFn(),
  ready: createMockFn().mockReturnValue({ catch: createMockFn() }),
};

global.logseq = mockLogseq;
