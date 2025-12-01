export default {
  testEnvironment: "jsdom",
  moduleFileExtensions: ["js"],
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "index.js",
    "!**/__tests__/**"
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  transform: {},
  moduleNameMapper: {
    "^@logseq/libs$": "<rootDir>/__tests__/mocks/logseq.js"
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"]
};
