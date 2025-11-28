# Implementation Plan: Logseq "On This Day" Plugin

## Overview
This document outlines a comprehensive plan to improve the plugin's code quality, performance, architecture, and features. The plan is divided into 5 phases, prioritized by impact and dependencies.

---

## Phase 1: Critical Bug Fixes & Immediate Issues
**Timeline**: 1-2 days
**Priority**: CRITICAL
**Can be done in parallel**: Yes

### Task 1.1: Fix Date Comparison Bug
**File**: `index.js:314-316`
**Issue**: Missing parentheses on `getFullYear` method call
**Complexity**: Low

```javascript
// Current (BROKEN):
if (dateOnPage.getFullYear == today.getFullYear &&
    dateOnPage.getMonth()     == today.getMonth() &&
    dateOnPage.getDate()      == today.getDate()) {

// Fixed:
if (dateOnPage.getFullYear() == today.getFullYear() &&
    dateOnPage.getMonth()     == today.getMonth() &&
    dateOnPage.getDate()      == today.getDate()) {
```

**Testing**:
- Verify OTD page doesn't regenerate when clicking button on same day
- Test date navigation (previous/next) works correctly

---

### Task 1.2: Implement Settings Validation
**Files**: `index.js`
**Complexity**: Medium

**Implementation**:

```javascript
// Add after settingsTemplate definition
function validateSettings() {
  const settings = logseq.settings;

  // Validate startingYear
  const yearNum = parseInt(settings.startingYear, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
    logseq.App.showMsg(
      `Invalid starting year: ${settings.startingYear}. Using 2010 as default.`,
      "warning"
    );
    return { ...settings, startingYear: "2010" };
  }

  // Validate pageTitle
  if (!settings.pageTitle || settings.pageTitle.trim() === "") {
    logseq.App.showMsg(
      "Page title cannot be empty. Using 'On This Day' as default.",
      "warning"
    );
    return { ...settings, pageTitle: "On This Day" };
  }

  return settings;
}

// Call in main() before using settings
function main() {
  const validatedSettings = validateSettings();
  // ... rest of code
}
```

**Testing**:
- Test with invalid years (letters, negative, future)
- Test with empty page title
- Verify warning messages appear
- Verify fallback to defaults works

---

### Task 1.3: Remove Debug Console Logs
**Files**: `index.js`
**Complexity**: Low

**Changes**:
- Remove `console.log(queryTimeString)` at line 124
- Remove `console.log(err)` at line 343 (keep error handling)
- Add proper error logging only for development mode

**Implementation**:
```javascript
// Add at top of file
const DEBUG_MODE = false; // Set via environment or settings

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[OTD Debug]:', ...args);
  }
}

// Replace all console.log with debugLog
```

---

### Task 1.4: Fix Dependency Issues
**Files**: `package.json`
**Complexity**: Low

**Changes**:
```json
{
  "dependencies": {
    "@logseq/libs": "^0.0.17"
  },
  "devDependencies": {
    "parcel": "^2.11.0"
  }
}
```

**Remove**: `"yarn": "^1.22.19"` from dependencies

**Testing**:
- Run `npm install` or `yarn install`
- Run `npm run build`
- Test plugin in Logseq
- Verify all APIs still work

---

## Phase 2: Code Quality & Maintainability
**Timeline**: 3-5 days
**Priority**: HIGH
**Dependencies**: Phase 1 completed

### Task 2.1: Standardize Variable Declarations
**Files**: `index.js`
**Complexity**: Low

**Rules**:
- Use `const` for values that don't change
- Use `let` for values that do change
- Remove all `var` declarations

**Changes**: ~20 locations throughout the file

**Example**:
```javascript
// Before:
var queryTimeString = '(or';
for (var i=startingYear; i<=year; i++) {

// After:
let queryTimeString = '(or';
for (let i=startingYear; i<=year; i++) {
```

---

### Task 2.2: Extract Constants
**Files**: Create `src/constants.js`
**Complexity**: Medium

```javascript
// src/constants.js
export const DIRECTION = {
  PREVIOUS: "Previous",
  NEXT: "Next",
  TODAY: "Today"
};

export const MESSAGES = {
  NO_ENTRIES: "No entries on this day",
  ERROR_QUERY: "Maybe something wrong with the query",
  INVALID_YEAR: "Invalid starting year: {year}. Using {default} as default.",
  EMPTY_TITLE: "Page title cannot be empty. Using '{default}' as default.",
};

export const DEFAULTS = {
  STARTING_YEAR: "2010",
  PAGE_TITLE: "On This Day",
  MIN_YEAR: 1900,
};

export const UI = {
  BUTTON_POSITIONS: {
    PAGEBAR: "pagebar",
    TOOLBAR: "toolbar"
  },
  ICONS: {
    MONUMENT: "ti ti-building-monument",
    ARROW_LEFT: "ti ti-arrow-move-left",
    ARROW_RIGHT: "ti ti-arrow-move-right"
  }
};
```

**Update**: All references in `index.js` to use these constants

---

### Task 2.3: Add JSDoc Comments
**Files**: `index.js`
**Complexity**: Medium

**Add documentation for all functions**:

```javascript
/**
 * Generates a Datalog query to find journal pages created on this day in previous years
 * @param {Date} date - The target date to query for
 * @returns {string} A Datalog query string
 * @example
 * getQueryScriptOTD(new Date('2023-01-26'))
 * // Returns query for all journals on January 26th from startingYear to 2023
 */
function getQueryScriptOTD(date) {
  // ...
}

/**
 * Retrieves or creates the "On This Day" page
 * @returns {Promise<{page: Object, dateOnPage: Date|null}>} Page object and current date on page
 * @throws {Error} If page cannot be created or accessed
 */
async function getOTDPage() {
  // ...
}
```

**Document**: All 15+ functions with:
- Purpose description
- Parameters with types
- Return value with type
- Exceptions/errors
- Usage examples where helpful

---

### Task 2.4: Improve Variable Naming
**Files**: `index.js`
**Complexity**: Low

**Rename**:
```javascript
// Poor names → Better names
jump_query_ret      → jumpQueryResults
query_ret_pages     → journalPages
tmpJournal          → closestJournal
ret                 → queryResult
pageDate            → otdPageData
curPageIsJournal    → isCurrentPageJournal
curPageIsOTD        → isCurrentPageOTD
```

---

### Task 2.5: Add ESLint Configuration
**Files**: Create `.eslintrc.json`, `package.json`
**Complexity**: Low

```json
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": "warn"
  }
}
```

**Add to package.json**:
```json
"scripts": {
  "lint": "eslint index.js",
  "lint:fix": "eslint index.js --fix"
},
"devDependencies": {
  "eslint": "^8.56.0"
}
```

---

## Phase 3: Architecture Refactoring
**Timeline**: 5-7 days
**Priority**: HIGH
**Dependencies**: Phase 2 completed

### Task 3.1: Create Modular File Structure
**Complexity**: High

**New Structure**:
```
src/
  ├── constants.js          # Constants and configuration
  ├── settings.js           # Settings schema and validation
  ├── utils/
  │   ├── dateUtils.js      # Date manipulation functions
  │   └── queryBuilder.js   # Datalog query generation
  ├── services/
  │   ├── pageService.js    # Page CRUD operations
  │   └── journalService.js # Journal-specific operations
  ├── ui/
  │   └── buttonRegistry.js # UI button registration
  └── index.js              # Main entry point
```

---

### Task 3.2: Implement dateUtils.js
**File**: `src/utils/dateUtils.js`
**Complexity**: Low

```javascript
/**
 * Date utility functions for the On This Day plugin
 */

/**
 * Returns the previous day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the previous day
 */
export function previousDay(date) {
  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() - 1);
  return previous;
}

/**
 * Returns the next day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the next day
 */
export function nextDay(date) {
  const next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);
  return next;
}

/**
 * Formats a date as YYYYMMDD for Logseq journal day format
 * @param {Date} date - The date to format
 * @returns {number} Date in YYYYMMDD format
 */
export function formatJournalDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

/**
 * Checks if two dates represent the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day, month, and year
 */
export function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Gets today's date as a dictionary
 * @returns {{year: number, month: number, day: number}}
 */
export function getTodayDict() {
  const date = new Date();
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}
```

---

### Task 3.3: Implement queryBuilder.js
**File**: `src/utils/queryBuilder.js`
**Complexity**: Medium

```javascript
/**
 * Datalog query builder for journal queries
 */

/**
 * Builds a query to find journals on a specific day across multiple years
 * @param {Date} date - The target date
 * @param {number} startingYear - The earliest year to include
 * @returns {string} Datalog query string
 */
export function buildOnThisDayQuery(date, startingYear) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const conditions = [];
  for (let i = startingYear; i <= year; i++) {
    const timeString = `${i}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    conditions.push(`[(= ?d ${timeString})]`);
  }

  const queryTimeString = `(or ${conditions.join(' ')})`;

  return `
    [:find (pull ?p [*])
     :where
     [?b :block/page ?p]
     [?p :block/journal? true]
     [?p :block/journal-day ?d]
     ${queryTimeString}]
  `;
}

/**
 * Builds a query to find the OTD page by title
 * @param {string} pageTitle - The page title to search for
 * @returns {string} Datalog query string
 */
export function buildOTDPageQuery(pageTitle) {
  const pageTitleLowerCase = pageTitle.toLowerCase();
  return `
    [:find (pull ?p [*])
     :where
     [?b :block/page ?p]
     [?p :block/name "${pageTitleLowerCase}"]]
  `;
}

/**
 * Builds a query to find journals before or after a specific date
 * @param {number} journalDay - Journal day in YYYYMMDD format
 * @param {'Previous'|'Next'} direction - Direction to search
 * @returns {string} Datalog query string
 */
export function buildJumpQuery(journalDay, direction) {
  const operator = direction === "Previous" ? "<" : ">";

  return `
    [:find (pull ?p [*])
     :where
     [?b :block/page ?p]
     [?p :block/journal? true]
     [?p :block/journal-day ?d]
     [(${operator} ?d ${journalDay})]]
  `;
}
```

---

### Task 3.4: Implement pageService.js
**File**: `src/services/pageService.js`
**Complexity**: Medium

```javascript
/**
 * Service for page operations
 */
import { buildOTDPageQuery } from '../utils/queryBuilder.js';

/**
 * Retrieves or creates the On This Day page
 * @param {string} pageTitle - The title of the OTD page
 * @returns {Promise<{page: Object, dateOnPage: Date|null}>}
 */
export async function getOrCreateOTDPage(pageTitle) {
  const queryScript = buildOTDPageQuery(pageTitle);
  const result = await logseq.DB.datascriptQuery(queryScript);

  if (result.length < 1) {
    // Page doesn't exist, create it
    const page = await logseq.Editor.createPage(
      pageTitle,
      {},
      { format: "markdown", journal: false, createFirstBlock: false }
    );
    return { page, dateOnPage: null };
  }

  // Page exists
  const page = result[0][0];

  // Open the page
  if (page?.name) {
    logseq.App.pushState("page", { name: page.name });
  }

  // Get the date from the first block
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
  let dateOnPage = null;

  if (pageBlocksTree.length >= 1) {
    const dateBlock = pageBlocksTree[0];
    dateOnPage = new Date(dateBlock.content);
  }

  return { page, dateOnPage };
}

/**
 * Removes all blocks from the current page
 * @returns {Promise<void>}
 */
export async function clearPageBlocks() {
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();

  // Use Promise.all for parallel deletion
  await Promise.all(
    pageBlocksTree.map(block => logseq.Editor.removeBlock(block.uuid))
  );
}

/**
 * Populates the OTD page with journal entries
 * @param {Date} date - The date to generate for
 * @param {Object} page - The page object
 * @param {Array} journalPages - Array of journal page objects
 * @returns {Promise<void>}
 */
export async function populateOTDPage(date, page, journalPages) {
  // Add date header
  const dateString = date.toISOString().split("T")[0];
  await logseq.Editor.appendBlockInPage(page.uuid, dateString);

  if (journalPages.length === 0) {
    await logseq.Editor.appendBlockInPage(page.uuid, "No entries on this day");
    return;
  }

  // Add journal embeds in parallel
  const embedPromises = journalPages.map(journal =>
    logseq.Editor.appendBlockInPage(page.uuid, `{{embed [[${journal.name}]]}}`)
  );
  await Promise.all(embedPromises);

  // Add empty block and exit edit mode
  await logseq.Editor.appendBlockInPage(page.uuid, "");
  await logseq.Editor.exitEditingMode(true);

  // Scroll to top
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
  if (pageBlocksTree.length > 0) {
    logseq.Editor.scrollToBlockInPage(page.name, pageBlocksTree[0].uuid);
  }
}
```

---

### Task 3.5: Implement journalService.js
**File**: `src/services/journalService.js`
**Complexity**: Medium

```javascript
/**
 * Service for journal-specific operations
 */
import { buildOnThisDayQuery, buildJumpQuery } from '../utils/queryBuilder.js';
import { DIRECTION } from '../constants.js';

/**
 * Fetches journal pages for a specific date across years
 * @param {Date} date - The target date
 * @param {number} startingYear - The earliest year to include
 * @returns {Promise<Array>} Array of journal page objects
 */
export async function fetchJournalsForDate(date, startingYear) {
  const queryScript = buildOnThisDayQuery(date, startingYear);
  const result = await logseq.DB.datascriptQuery(queryScript);
  return result?.flat() || [];
}

/**
 * Finds the closest journal in a given direction
 * @param {number} journalDay - Current journal day in YYYYMMDD format
 * @param {string} direction - 'Previous' or 'Next'
 * @returns {Promise<Object|null>} The closest journal page or null
 */
export async function findClosestJournal(journalDay, direction) {
  const queryScript = buildJumpQuery(journalDay, direction);
  const result = await logseq.DB.datascriptQuery(queryScript);
  const journals = result?.flat() || [];

  if (journals.length === 0) return null;

  // Find the closest journal
  if (direction === DIRECTION.PREVIOUS) {
    return journals.reduce((closest, current) =>
      current["journal-day"] > closest["journal-day"] ? current : closest
    );
  } else if (direction === DIRECTION.NEXT) {
    return journals.reduce((closest, current) =>
      current["journal-day"] < closest["journal-day"] ? current : closest
    );
  }

  return null;
}

/**
 * Navigates to a journal page
 * @param {Object} journal - The journal page object
 * @returns {void}
 */
export function navigateToJournal(journal) {
  if (journal?.name) {
    logseq.App.pushState("page", { name: journal.name });
  }
}
```

---

### Task 3.6: Implement settings.js
**File**: `src/settings.js`
**Complexity**: Low

```javascript
/**
 * Settings configuration and validation
 */
import { DEFAULTS, MESSAGES } from './constants.js';

export const settingsTemplate = [
  {
    key: "startingYear",
    type: 'string',
    default: DEFAULTS.STARTING_YEAR,
    title: "Starting Year for the On This Day page",
    description: "On This Day page will list journals starting from this year. Journals before this year will be skipped."
  },
  {
    key: "pageTitle",
    type: 'string',
    default: DEFAULTS.PAGE_TITLE,
    title: "Page title for the On This Day page",
    description: "Specify if you wish to change the page title. Non-English characters are supported. Warning: existing contents on this page will be removed every time."
  },
  {
    key: "enableJump",
    type: "boolean",
    default: false,
    title: "Enable jumping to previous/next day",
    description: "Navigate between days using arrow buttons. Restart Logseq to apply changes."
  },
  {
    key: "jumpButtonPosition",
    type: "enum",
    default: "pagebar",
    enumChoices: ["pagebar", "toolbar"],
    enumPicker: "radio",
    title: "Jump button placement",
    description: "Choose where to display the jump buttons. Only applies when jumping is enabled. Restart Logseq to apply changes."
  }
];

/**
 * Validates plugin settings and returns corrected values
 * @param {Object} settings - The current settings object
 * @returns {Object} Validated settings
 */
export function validateSettings(settings) {
  const validated = { ...settings };

  // Validate startingYear
  const yearNum = parseInt(settings.startingYear, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum) || yearNum < DEFAULTS.MIN_YEAR || yearNum > currentYear) {
    logseq.App.showMsg(
      MESSAGES.INVALID_YEAR
        .replace('{year}', settings.startingYear)
        .replace('{default}', DEFAULTS.STARTING_YEAR),
      "warning"
    );
    validated.startingYear = DEFAULTS.STARTING_YEAR;
  }

  // Validate pageTitle
  if (!settings.pageTitle || settings.pageTitle.trim() === "") {
    logseq.App.showMsg(
      MESSAGES.EMPTY_TITLE.replace('{default}', DEFAULTS.PAGE_TITLE),
      "warning"
    );
    validated.pageTitle = DEFAULTS.PAGE_TITLE;
  }

  return validated;
}
```

---

### Task 3.7: Refactor index.js
**File**: `src/index.js`
**Complexity**: High

Simplify to orchestration layer:

```javascript
import "@logseq/libs";
import { settingsTemplate, validateSettings } from './settings.js';
import { DIRECTION } from './constants.js';
import { previousDay, nextDay, isSameDay } from './utils/dateUtils.js';
import { getOrCreateOTDPage, clearPageBlocks, populateOTDPage } from './services/pageService.js';
import { fetchJournalsForDate, findClosestJournal, navigateToJournal } from './services/journalService.js';
import { registerButtons } from './ui/buttonRegistry.js';

logseq.useSettingsSchema(settingsTemplate);

/**
 * Main function to generate On This Day page
 * @param {string} showDate - Direction: 'Today', 'Previous', or 'Next'
 */
async function generateOnThisDay(showDate) {
  try {
    const settings = validateSettings(logseq.settings);
    const today = new Date();

    const { page, dateOnPage } = await getOrCreateOTDPage(settings.pageTitle);

    // Determine target date
    let targetDate;
    if (!dateOnPage) {
      targetDate = today;
    } else if (isSameDay(dateOnPage, today)) {
      return; // Already showing today
    } else {
      switch (showDate) {
        case DIRECTION.PREVIOUS:
          targetDate = previousDay(dateOnPage);
          break;
        case DIRECTION.NEXT:
          targetDate = nextDay(dateOnPage);
          break;
        case DIRECTION.TODAY:
          targetDate = today;
          break;
        default:
          console.error("Invalid direction:", showDate);
          return;
      }
      await clearPageBlocks();
    }

    // Fetch and populate
    const journals = await fetchJournalsForDate(targetDate, parseInt(settings.startingYear));
    await populateOTDPage(targetDate, page, journals);

  } catch (err) {
    logseq.App.showMsg(err.message || "Error generating On This Day page", "error");
    console.error(err);
  }
}

/**
 * Adaptive jump function that works on both journal and OTD pages
 * @param {string} direction - 'Previous' or 'Next'
 */
async function adaptiveJump(direction) {
  const settings = validateSettings(logseq.settings);
  const currentPage = await logseq.Editor.getCurrentPage();

  const isJournalPage = currentPage["journal?"];
  const isOTDPage = currentPage["originalName"] === settings.pageTitle;

  if (isJournalPage) {
    const closestJournal = await findClosestJournal(currentPage.journalDay, direction);
    if (closestJournal) {
      navigateToJournal(closestJournal);
    }
  } else if (isOTDPage) {
    await generateOnThisDay(direction);
  }
}

/**
 * Main entry point
 */
function main() {
  // Register handlers
  logseq.provideModel({
    handleOnThisDay() {
      generateOnThisDay(DIRECTION.TODAY);
    },
    handlePrevious() {
      adaptiveJump(DIRECTION.PREVIOUS);
    },
    handleNext() {
      adaptiveJump(DIRECTION.NEXT);
    },
  });

  // Register UI buttons
  const settings = validateSettings(logseq.settings);
  registerButtons(settings.enableJump, settings.jumpButtonPosition);
}

logseq.ready(main).catch(console.error);
```

---

### Task 3.8: Implement buttonRegistry.js
**File**: `src/ui/buttonRegistry.js`
**Complexity**: Low

```javascript
/**
 * UI button registration
 */
import { UI } from '../constants.js';

/**
 * Registers toolbar and pagebar buttons
 * @param {boolean} enableJump - Whether to show jump buttons
 * @param {string} jumpButtonPosition - Where to place jump buttons
 */
export function registerButtons(enableJump, jumpButtonPosition) {
  // Previous button (conditional)
  if (enableJump) {
    logseq.App.registerUIItem(jumpButtonPosition, {
      key: "on-this-day-previous",
      template: `
        <span class="on-this-day-previous">
          <a title="Previous Day" class="button" data-on-click="handlePrevious">
            <i class="${UI.ICONS.ARROW_LEFT}"></i>
          </a>
        </span>
      `,
    });
  }

  // Main OTD button (always visible)
  logseq.App.registerUIItem(UI.BUTTON_POSITIONS.TOOLBAR, {
    key: "on-this-day-main",
    template: `
      <span class="on-this-day">
        <a title="On This Day" class="button" data-on-click="handleOnThisDay">
          <i class="${UI.ICONS.MONUMENT}"></i>
        </a>
      </span>
    `,
  });

  // Next button (conditional)
  if (enableJump) {
    logseq.App.registerUIItem(jumpButtonPosition, {
      key: "on-this-day-next",
      template: `
        <span class="on-this-day-next">
          <a title="Next Day" class="button" data-on-click="handleNext">
            <i class="${UI.ICONS.ARROW_RIGHT}"></i>
          </a>
        </span>
      `,
    });
  }
}
```

---

### Task 3.9: Update Build Configuration
**File**: `package.json`
**Complexity**: Medium

**Update for Parcel 2**:
```json
{
  "name": "logseq-on-this-day",
  "version": "0.0.4",
  "type": "module",
  "source": "src/index.js",
  "main": "dist/index.html",
  "scripts": {
    "dev": "parcel index.html --port 1235",
    "build": "parcel build index.html --public-url ./ --no-source-maps --no-optimize",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "test": "jest"
  },
  "dependencies": {
    "@logseq/libs": "^0.0.17"
  },
  "devDependencies": {
    "parcel": "^2.11.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0"
  }
}
```

---

## Phase 4: Testing & Documentation
**Timeline**: 4-6 days
**Priority**: MEDIUM
**Dependencies**: Phase 3 completed

### Task 4.1: Setup Testing Framework
**Files**: Create `jest.config.js`, `src/__tests__/`
**Complexity**: Medium

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

### Task 4.2: Write Unit Tests
**Files**: `src/__tests__/*.test.js`
**Complexity**: High

**Test files to create**:
- `dateUtils.test.js` - Test date manipulation
- `queryBuilder.test.js` - Test query generation
- `settings.test.js` - Test settings validation
- `pageService.test.js` - Test page operations (with mocks)
- `journalService.test.js` - Test journal operations (with mocks)

**Example test**:
```javascript
// src/__tests__/dateUtils.test.js
import { previousDay, nextDay, isSameDay, formatJournalDay } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('previousDay', () => {
    it('should return the previous day', () => {
      const date = new Date('2023-01-15');
      const result = previousDay(date);
      expect(result.getDate()).toBe(14);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2023);
    });

    it('should handle month boundaries', () => {
      const date = new Date('2023-02-01');
      const result = previousDay(date);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0); // January
    });

    it('should not mutate original date', () => {
      const date = new Date('2023-01-15');
      previousDay(date);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2023-01-15T10:00:00');
      const date2 = new Date('2023-01-15T18:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2023-01-15');
      const date2 = new Date('2023-01-16');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('formatJournalDay', () => {
    it('should format date as YYYYMMDD', () => {
      const date = new Date('2023-01-15');
      expect(formatJournalDay(date)).toBe(20230115);
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2023-03-05');
      expect(formatJournalDay(date)).toBe(20230305);
    });
  });
});
```

**Coverage goal**: Aim for 70%+ coverage on utils and services

---

### Task 4.3: Write Integration Tests
**Files**: `src/__tests__/integration/`
**Complexity**: High

Test end-to-end workflows:
- Creating OTD page
- Navigating between dates
- Jump functionality
- Settings validation

---

### Task 4.4: Enhance README
**File**: `README.md`
**Complexity**: Medium

**Add sections**:
```markdown
## Installation

### From Logseq Marketplace
1. Open Logseq
2. Go to Settings → Plugins → Marketplace
3. Search for "On This Day"
4. Click Install

### Manual Installation
1. Download the latest release from GitHub
2. Extract to your Logseq plugins folder
3. Restart Logseq

## Usage

### Basic Usage
1. Click the monument icon (🏛️) in the toolbar
2. The "On This Day" page will be generated
3. View journal entries from this day in previous years

### Navigation
- Use arrow buttons to navigate to previous/next days
- Works on both journal pages and the OTD page

## Configuration

Access settings via: Settings → Plugins → On This Day

| Setting | Default | Description |
|---------|---------|-------------|
| Starting Year | 2010 | Earliest year to include |
| Page Title | "On This Day" | Custom page title |
| Enable Jump | false | Show navigation arrows |
| Jump Button Position | pagebar | Where to place arrows |

## Troubleshooting

### Page doesn't generate
- Check that you have journals created
- Verify the starting year is valid
- Try refreshing Logseq

### Settings not taking effect
- Restart Logseq after changing settings
- Check console for error messages

## Development

### Setup
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
npm run lint
```

### Building
```bash
npm run build
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file

## Changelog

See CHANGELOG.md for version history
```

---

### Task 4.5: Create CHANGELOG.md
**File**: `CHANGELOG.md`
**Complexity**: Low

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.0.4] - 2024-XX-XX

### Fixed
- Critical bug: Date comparison now works correctly
- Settings validation prevents invalid inputs
- Removed debug console logs

### Changed
- Refactored codebase into modular structure
- Improved performance with parallel operations
- Updated dependencies to latest versions
- Standardized code style with ESLint

### Added
- Comprehensive test suite
- JSDoc comments throughout codebase
- Better error handling and messages
- Input validation for settings

## [0.0.3] - Previous release
- Added jump to previous/next day feature
- ...
```

---

### Task 4.6: Create CONTRIBUTING.md
**File**: `CONTRIBUTING.md`
**Complexity**: Low

Guidelines for contributors:
- Code style requirements
- How to run tests
- PR submission process
- Issue reporting guidelines

---

## Phase 5: Feature Enhancements
**Timeline**: 7-10 days (ongoing)
**Priority**: LOW
**Dependencies**: Phase 4 completed

### Task 5.1: Add Keyboard Shortcuts
**Complexity**: Medium
**Impact**: High

**Implementation**:
```javascript
// In main()
logseq.App.registerCommandPalette({
  key: "on-this-day",
  label: "Open On This Day",
  keybinding: {
    mode: "global",
    binding: "mod+shift+o"
  }
}, async () => {
  await generateOnThisDay(DIRECTION.TODAY);
});

logseq.App.registerCommandPalette({
  key: "jump-previous-day",
  label: "Jump to Previous Day",
  keybinding: {
    mode: "global",
    binding: "mod+shift+["
  }
}, async () => {
  await adaptiveJump(DIRECTION.PREVIOUS);
});

logseq.App.registerCommandPalette({
  key: "jump-next-day",
  label: "Jump to Next Day",
  keybinding: {
    mode: "global",
    binding: "mod+shift+]"
  }
}, async () => {
  await adaptiveJump(DIRECTION.NEXT);
});
```

---

### Task 5.2: Add Loading Indicators
**Complexity**: Medium
**Impact**: Medium

**Implementation**:
```javascript
async function generateOnThisDay(showDate) {
  const loadingMsg = logseq.App.showMsg("Generating On This Day page...", "info", { timeout: 0 });

  try {
    // ... existing code ...
    logseq.App.showMsg("On This Day page generated successfully!", "success");
  } catch (err) {
    logseq.App.showMsg(err.message, "error");
  } finally {
    // Close loading message
    if (loadingMsg) {
      logseq.App.closeMsg(loadingMsg);
    }
  }
}
```

---

### Task 5.3: Add Date Format Customization
**Complexity**: Medium
**Impact**: Medium

**Add to settings**:
```javascript
{
  key: "dateFormat",
  type: "enum",
  default: "iso",
  enumChoices: ["iso", "us", "eu", "custom"],
  title: "Date format",
  description: "How dates should be displayed"
},
{
  key: "customDateFormat",
  type: "string",
  default: "YYYY-MM-DD",
  title: "Custom date format",
  description: "Used when dateFormat is 'custom'. Example: DD/MM/YYYY"
}
```

**Add formatting function**:
```javascript
export function formatDate(date, format) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'iso':
      return `${year}-${month}-${day}`;
    case 'us':
      return `${month}/${day}/${year}`;
    case 'eu':
      return `${day}/${month}/${year}`;
    case 'custom':
      // Implement custom format parsing
      return customFormat(date, logseq.settings.customDateFormat);
    default:
      return date.toISOString().split('T')[0];
  }
}
```

---

### Task 5.4: Add Filter by Tags
**Complexity**: High
**Impact**: High

**Add to settings**:
```javascript
{
  key: "filterTags",
  type: "string",
  default: "",
  title: "Filter by tags",
  description: "Comma-separated list of tags to filter. Leave empty for no filter."
}
```

**Update query builder**:
```javascript
export function buildOnThisDayQuery(date, startingYear, tags = []) {
  // ... existing query building ...

  if (tags.length > 0) {
    const tagConditions = tags.map(tag =>
      `[?b :block/refs ?ref] [?ref :block/name "${tag.toLowerCase()}"]`
    ).join(' ');

    // Add to query
  }

  return query;
}
```

---

### Task 5.5: Add Statistics Dashboard
**Complexity**: High
**Impact**: Medium

**Features**:
- Total journals created
- Busiest months/years
- Longest streaks
- Activity heatmap

**Implementation**: New page with embedded queries and visualizations

---

### Task 5.6: Add Export Functionality
**Complexity**: Medium
**Impact**: Medium

**Add export button**:
```javascript
logseq.App.registerUIItem("toolbar", {
  key: "export-otd",
  template: `
    <a title="Export On This Day" class="button" data-on-click="handleExport">
      <i class="ti ti-download"></i>
    </a>
  `
});
```

**Export function**:
```javascript
async function exportOTD() {
  const pageBlocks = await logseq.Editor.getCurrentPageBlocksTree();
  const content = blocksToMarkdown(pageBlocks);

  // Download as file
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `on-this-day-${new Date().toISOString()}.md`;
  a.click();
}
```

---

### Task 5.7: Add Debouncing to Buttons
**Complexity**: Low
**Impact**: Low

```javascript
// utils/debounce.js
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// In main()
logseq.provideModel({
  handleOnThisDay: debounce(() => generateOnThisDay(DIRECTION.TODAY), 500),
  handlePrevious: debounce(() => adaptiveJump(DIRECTION.PREVIOUS), 300),
  handleNext: debounce(() => adaptiveJump(DIRECTION.NEXT), 300),
});
```

---

### Task 5.8: Add Empty State Improvements
**Complexity**: Low
**Impact**: Medium

**Better empty state message**:
```javascript
if (journalPages.length === 0) {
  const emptyMessage = `
## No entries on this day

You haven't created any journal entries on ${formatDate(date)} in previous years.

**Tips:**
- Start journaling today to build your history
- Use Logseq's daily notes feature
- Come back next year to see this day's memories!
  `;
  await logseq.Editor.appendBlockInPage(page.uuid, emptyMessage);
}
```

---

### Task 5.9: Add Query Result Caching
**Complexity**: High
**Impact**: Medium

```javascript
// services/cacheService.js
class QueryCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
```

---

### Task 5.10: Add Undo Functionality
**Complexity**: High
**Impact**: High

**Implementation**:
```javascript
class PageHistory {
  constructor(maxSize = 10) {
    this.history = [];
    this.maxSize = maxSize;
  }

  async saveState(page) {
    const blocks = await logseq.Editor.getCurrentPageBlocksTree();
    this.history.push({
      timestamp: Date.now(),
      blocks: JSON.parse(JSON.stringify(blocks))
    });

    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  async undo(page) {
    if (this.history.length === 0) return false;

    const previousState = this.history.pop();
    await clearPageBlocks();

    for (const block of previousState.blocks) {
      await logseq.Editor.appendBlockInPage(page.uuid, block.content);
    }

    return true;
  }
}
```

---

## Phase 6: Advanced Features (Future)
**Timeline**: Ongoing
**Priority**: OPTIONAL

### Future Enhancements:
1. **Calendar View**: Visual calendar showing journal activity
2. **Search Within Results**: Find specific content in displayed journals
3. **Multi-year Comparison**: Side-by-side view of multiple years
4. **Reminders**: Notify users of past entries
5. **Templates**: Custom templates for OTD page
6. **Themes**: Custom styling options
7. **Analytics**: Detailed writing patterns and insights
8. **API Integration**: Share to social media, export to other apps
9. **Collaborative Features**: Share OTD pages with others
10. **AI Summaries**: Summarize journal entries with AI

---

## Testing Strategy

### Manual Testing Checklist:
- [ ] Fresh install in Logseq
- [ ] OTD page creation
- [ ] Date navigation (previous/next)
- [ ] Jump between journal pages
- [ ] Settings validation (invalid years, empty titles)
- [ ] Multi-year journal viewing
- [ ] Empty state (no journals on date)
- [ ] Button positioning (toolbar vs pagebar)
- [ ] Keyboard shortcuts
- [ ] Performance with large number of journals

### Automated Testing:
- Unit tests for all utility functions
- Integration tests for core workflows
- Mock Logseq API for testing
- Coverage reports

---

## Success Metrics

### Code Quality:
- [ ] ESLint passing with no errors
- [ ] Test coverage > 70%
- [ ] All critical bugs fixed
- [ ] No console warnings in production

### Performance:
- [ ] Page generation < 2 seconds for 100 journals
- [ ] No blocking operations
- [ ] Efficient memory usage

### User Experience:
- [ ] Clear error messages
- [ ] Loading indicators for long operations
- [ ] Intuitive button placement
- [ ] Helpful empty states

---

## Maintenance Plan

### Regular Updates:
1. **Monthly**: Check for Logseq API updates
2. **Quarterly**: Review dependencies for security updates
3. **Bi-annually**: Major feature releases
4. **As needed**: Bug fixes and community PRs

### Community Engagement:
- Monitor GitHub issues
- Review pull requests
- Update documentation
- Gather user feedback

---

## Risk Assessment

### High Risk:
- **Breaking API changes**: Logseq API is still evolving
  - Mitigation: Pin versions, test before updating

- **Data loss**: Clearing page blocks could lose user content
  - Mitigation: Add warnings, implement undo functionality

### Medium Risk:
- **Performance issues**: Large number of journals
  - Mitigation: Implement pagination, caching

- **Browser compatibility**: Different Logseq versions
  - Mitigation: Test across versions, use stable APIs

### Low Risk:
- **User confusion**: New features
  - Mitigation: Clear documentation, tooltips

---

## Timeline Summary

| Phase | Duration | Priority | Complexity |
|-------|----------|----------|------------|
| Phase 1: Critical Fixes | 1-2 days | CRITICAL | Low-Medium |
| Phase 2: Code Quality | 3-5 days | HIGH | Medium |
| Phase 3: Architecture | 5-7 days | HIGH | High |
| Phase 4: Testing & Docs | 4-6 days | MEDIUM | Medium-High |
| Phase 5: Features | 7-10 days | LOW | Medium-High |
| Phase 6: Advanced | Ongoing | OPTIONAL | High |

**Total estimated time for Phases 1-4**: 13-20 days
**Full implementation with Phase 5**: 20-30 days

---

## Next Steps

1. **Immediate**: Fix critical bug (date comparison)
2. **This week**: Complete Phase 1 and 2
3. **Next 2 weeks**: Phase 3 refactoring
4. **Month 1**: Complete testing and documentation
5. **Ongoing**: Add features based on user feedback

---

## Resources Needed

- **Development**: 1 developer, part-time
- **Testing**: Manual testing on different Logseq versions
- **Documentation**: Technical writing for README and API docs
- **Community**: Beta testers for new features

---

## Questions to Consider

1. Should the plugin support Logseq's graph database directly?
2. Is there interest in a premium version with advanced features?
3. Should we create a companion mobile app?
4. Would users want cloud sync for OTD pages?
5. Is there value in integrating with other note-taking tools?

---

*This implementation plan is a living document and should be updated as the project evolves.*
