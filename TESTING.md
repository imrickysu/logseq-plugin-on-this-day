# Testing Guide

This document explains how to run and write tests for the Logseq "On This Day" plugin.

## Prerequisites

Make sure you have the dependencies installed:

```bash
npm install
```

## Running Tests

### Run all tests once

```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)

```bash
npm run test:watch
```

### Run tests with coverage report

```bash
npm run test:coverage
```

This will generate a coverage report showing which parts of the code are tested.

## Test Structure

Tests are organized in the `__tests__` directory:

```
__tests__/
├── mocks/
│   └── logseq.js          # Mock implementation of Logseq API
├── setup.js               # Test environment setup
├── testUtils.js           # Exported functions for testing
└── unit/
    ├── dateUtils.test.js       # Tests for date utility functions
    ├── validation.test.js      # Tests for settings validation
    └── queryBuilders.test.js   # Tests for query builders
```

## What's Tested

### Date Utilities (28 tests)
- `previousDay()` - Handles day/month/year boundaries, leap years
- `nextDay()` - Handles day/month/year boundaries, leap years
- `getTodayDict()` - Returns correct date structure

### Settings Validation (15 tests)
- `validateSettings()` - Validates startingYear and pageTitle
  - Accepts valid years (1900 to current year)
  - Rejects invalid inputs (non-numbers, future years, empty titles)
  - Returns corrected default values when invalid
  - Shows appropriate warning messages

### Query Builders (22 tests)
- `getQueryScriptOTD()` - Generates Datalog queries for finding journals
  - Includes all years from startingYear to current
  - Formats dates correctly (YYYYMMDD)
  - Handles leap years
- `getQueryScriptOTDPageID()` - Finds the OTD page by title
  - Converts titles to lowercase
  - Handles non-English characters
- `getQueryScriptPN()` - Generates queries for previous/next navigation
  - Uses correct operators (< for previous, > for next)
  - Returns undefined for invalid directions

**Total: 50 tests, all passing ✅**

## Test Output Example

```bash
$ npm test

PASS __tests__/unit/dateUtils.test.js
PASS __tests__/unit/validation.test.js
PASS __tests__/unit/queryBuilders.test.js

Test Suites: 3 passed, 3 total
Tests:       50 passed, 50 total
Snapshots:   0 total
Time:        4.993 s
```

## Coverage Report

To see which code is covered by tests:

```bash
npm run test:coverage
```

Example output:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 __tests__          |     100 |      100 |     100 |     100 |
  testUtils.js      |     100 |      100 |     100 |     100 |
--------------------|---------|----------|---------|---------|-------------------
```

## Writing New Tests

### Example Test

```javascript
import { previousDay } from "../testUtils.js";

describe("Date Utilities", () => {
  test("should return the previous day", () => {
    const date = new Date("2023-01-15T12:00:00Z");
    const result = previousDay(date);

    expect(result.getDate()).toBe(14);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2023);
  });
});
```

### Testing with Mocks

The Logseq API is mocked for testing. You can check if functions were called:

```javascript
import { validateSettings } from "../testUtils.js";
import { mockLogseq } from "../mocks/logseq.js";

test("should show warning for invalid year", () => {
  mockLogseq.settings.startingYear = "invalid";

  validateSettings();

  // Check that showMsg was called
  expect(mockLogseq.App.showMsg.calls.length).toBeGreaterThan(0);
  expect(mockLogseq.App.showMsg.calls[0][0]).toContain("Invalid starting year");
});
```

## Continuous Integration

Tests should be run before:
1. **Committing changes** - Ensure nothing is broken
2. **Creating pull requests** - Verify all tests pass
3. **Releasing new versions** - Confirm stability

## Test-Driven Refactoring

When refactoring code:

1. **Run tests before** - Ensure all tests pass
2. **Make your changes** - Refactor the code
3. **Run tests after** - Verify behavior hasn't changed
4. **All tests pass?** - Refactoring is safe ✅

This ensures that refactoring doesn't break existing functionality.

## Troubleshooting

### Tests fail with "jest is not defined"

Make sure you're using the custom mock functions in `__tests__/mocks/logseq.js` instead of `jest.fn()`.

### Tests fail with module import errors

Ensure `package.json` has `"type": "module"` set.

### Coverage threshold not met

Update the thresholds in `jest.config.js` if needed:

```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

## Further Reading

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Logseq Plugin API](https://plugins-doc.logseq.com/)
