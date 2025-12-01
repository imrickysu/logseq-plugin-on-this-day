/**
 * Test utilities - exports functions from index.js for testing
 * This file copies the pure functions from index.js to make them testable
 */

import { mockLogseq } from "./mocks/logseq.js";
global.logseq = mockLogseq;

// Constants from index.js
export const DIRECTION = {
  PREVIOUS: "Previous",
  NEXT: "Next",
  TODAY: "Today"
};

export const MESSAGES = {
  NO_ENTRIES: "No entries on this day",
  ERROR_QUERY: "Error generating On This Day page. Please check console for details.",
  INVALID_YEAR: "Invalid starting year: {year}. Must be between {min} and {max}. Using {default} as default.",
  EMPTY_TITLE: "Page title cannot be empty. Using 'On This Day' as default.",
  UNSUPPORTED_DIRECTION: "Error: Unsupported date direction:",
  INVALID_SHOWDATE: "Error: OTD: Invalid showDate value:",
  INVALID_INSTRUCTION: "Error: Invalid showDate instruction:"
};

export const DEFAULTS = {
  STARTING_YEAR: "2010",
  PAGE_TITLE: "On This Day",
  MIN_YEAR: 1900
};

// Pure utility functions (copied from index.js)
export function validateSettings() {
  const settings = logseq.settings;
  let isValid = true;

  const yearNum = parseInt(settings.startingYear, 10);
  const currentYear = new Date().getFullYear();

  if (isNaN(yearNum) || yearNum < DEFAULTS.MIN_YEAR || yearNum > currentYear) {
    logseq.App.showMsg(
      MESSAGES.INVALID_YEAR
        .replace("{year}", settings.startingYear)
        .replace("{min}", DEFAULTS.MIN_YEAR)
        .replace("{max}", currentYear)
        .replace("{default}", DEFAULTS.STARTING_YEAR),
      "warning"
    );
    isValid = false;
  }

  if (!settings.pageTitle || settings.pageTitle.trim() === "") {
    logseq.App.showMsg(MESSAGES.EMPTY_TITLE, "warning");
    isValid = false;
  }

  return {
    isValid,
    startingYear: (isNaN(yearNum) || yearNum < DEFAULTS.MIN_YEAR || yearNum > currentYear) ? DEFAULTS.STARTING_YEAR : settings.startingYear,
    pageTitle: (!settings.pageTitle || settings.pageTitle.trim() === "") ? DEFAULTS.PAGE_TITLE : settings.pageTitle
  };
}

export function previousDay(date) {
  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() - 1);
  return previous;
}

export function nextDay(date) {
  const next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);
  return next;
}

export function getTodayDict() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return { year: year, month: month, day: day };
}

export function getQueryScriptOTD(date) {
  const validatedSettings = validateSettings();
  const startingYear = parseInt(validatedSettings.startingYear, 10);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let queryTimeString = "(or";

  for (let i = startingYear; i <= year; i++) {
    const timeString = i + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
    queryTimeString += ` [(= ?d ${timeString})]`;
  }
  queryTimeString += ")";

  return (
    `
      [
      :find (pull ?p [*])
      :where
      [?b :block/page ?p]
      [?p :block/journal? true]
      [?p :block/journal-day ?d]
      ${queryTimeString}
      ]
    `
  );
}

export function getQueryScriptOTDPageID() {
  const validatedSettings = validateSettings();
  const pageTitle = validatedSettings.pageTitle;
  const pageTitleLowerCase = validatedSettings.pageTitle.toLowerCase();

  const blockNameQueryString = "[?p :block/name \"" + pageTitleLowerCase + "\"]";

  const queryString =
    `
  [:find (pull ?p [*])
            :where
            [?b :block/page ?p]
            ${blockNameQueryString}
          ]
  `;
  return (queryString);
}

export function getQueryScriptPN(journalDate, showDate) {
  let instruction;
  if (showDate == DIRECTION.PREVIOUS) {
    instruction = "<";
  }
  else if (showDate == DIRECTION.NEXT) {
    instruction = ">";
  }
  else {
    console.error(MESSAGES.UNSUPPORTED_DIRECTION, showDate);
    return;
  }

  const queryTimeString = `[(${instruction} ?d ${journalDate})]`;

  return (
    `
      [
      :find (pull ?p [*])
      :where
      [?b :block/page ?p]
      [?p :block/journal? true]
      [?p :block/journal-day ?d]
      ${queryTimeString}
      ]
    `
  );
}
