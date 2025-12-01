/**
 * Constants for the On This Day plugin
 */

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
