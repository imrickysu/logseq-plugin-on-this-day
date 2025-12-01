/**
 * Settings configuration and validation
 */

import { DEFAULTS, MESSAGES } from "./constants.js";

export const settingsTemplate = [
  {
    key: "startingYear",
    type: "string",
    default: DEFAULTS.STARTING_YEAR,
    title: "Starting Year for the On This Day page.",
    description: "On This Day page will List the journals starting from this year. Journals before this year will be skipped."
  },
  {
    key: "pageTitle",
    type: "string",
    default: DEFAULTS.PAGE_TITLE,
    title: "Page title for the On This Day page",
    description: "Specify if you wish to change the page title. It's valid to use non-English characters. Warning: existing contents on this page will be removed every time."
  },
  {
    key: "enableJump",
    type: "boolean",
    default: false,
    title: "Jumping to previous day or next day on the On This Day page",
    description: "Check what's going on on the previous day or the next day.\n\
    Two buttons will show on the upper right corner for controlling.\n\
    Restart Logseq to make changes take effect.",
  },
  {
    key: "jumpButtonPosition",
    type: "enum",
    default: "pagebar",
    enumChoices: ["pagebar", "toolbar"],
    enumPicker: "radio",
    title: "Where you wish to place the jump buttons",
    description: "pagebar: display on each page; toolbar: display with the On-This-Day button. Valid only when jumpping is enabled. \n\rRestart Logseq to make changes take effect.",
  }
];

/**
 * Validates plugin settings and returns corrected values if needed
 * @returns {{isValid: boolean, startingYear: string, pageTitle: string}} Validated settings object
 * @example
 * const validated = validateSettings();
 * if (!validated.isValid) {
 *   // Settings were corrected, warnings shown to user
 * }
 */
export function validateSettings() {
  const settings = logseq.settings;
  let isValid = true;

  // Validate startingYear
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
    // Note: We can't directly modify settings, but we'll return the corrected value
    isValid = false;
  }

  // Validate pageTitle
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
