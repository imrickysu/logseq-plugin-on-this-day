/**
 * Datalog query builder for journal queries
 */

import { DIRECTION, MESSAGES } from "../constants.js";
import { validateSettings } from "../settings.js";

/**
 * Generates a Datalog query to find journal pages created on this day in previous years
 * @param {Date} date - The target date to query for
 * @returns {string} A Datalog query string for finding journals on this day across years
 * @example
 * const query = getQueryScriptOTD(new Date('2023-01-26'));
 * // Returns query for all journals on January 26th from startingYear to 2023
 */
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

/**
 * Generates a Datalog query to find the "On This Day" page by title
 * @returns {string} A Datalog query string for finding the OTD page
 * @example
 * const query = getQueryScriptOTDPageID();
 * // Returns query to find the page with the configured title
 */
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

/**
 * Generates a Datalog query to find journals before or after a specific date
 * @param {number} journalDate - Journal day in YYYYMMDD format
 * @param {string} showDate - Direction to search: DIRECTION.PREVIOUS or DIRECTION.NEXT
 * @returns {string} A Datalog query string for finding adjacent journals
 * @example
 * const query = getQueryScriptPN(20230126, DIRECTION.PREVIOUS);
 * // Returns query for all journals before January 26, 2023
 */
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
