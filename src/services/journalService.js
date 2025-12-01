/**
 * Service for journal-specific operations
 */

import { DIRECTION, MESSAGES } from "../constants.js";
import { getQueryScriptPN } from "../utils/queryBuilder.js";
import { validateSettings } from "../settings.js";

/**
 * Jumps to the nearest journal page in the specified direction
 * @param {number} journalDay - Current journal day in YYYYMMDD format
 * @param {string} showDate - Direction to jump: DIRECTION.PREVIOUS or DIRECTION.NEXT
 * @returns {Promise<void>}
 * @example
 * await jump(20230126, DIRECTION.PREVIOUS);
 * // Navigates to the most recent journal before January 26, 2023
 */
export async function jump(journalDay, showDate) {
  // assume this is a journal page
  // show the previous journal or next journal of journalDay according to showDate
  // journalDay format 20230123
  const queryString = getQueryScriptPN(journalDay, showDate);
  const jumpQueryResults = await logseq.DB.datascriptQuery(queryString);

  const journals = jumpQueryResults?.flat();

  let closestJournal;
  if (showDate == DIRECTION.PREVIOUS) {
    closestJournal = journals.reduce((closest, currentJournal) => {
      if (currentJournal["journal-day"] > closest["journal-day"]) {
        return currentJournal;
      }
      return closest;
    });
  } else if (showDate == DIRECTION.NEXT) {
    closestJournal = journals.reduce((closest, currentJournal) => {
      if (currentJournal["journal-day"] < closest["journal-day"]) {
        return currentJournal;
      }
      return closest;
    });
  } else {
    console.error(MESSAGES.INVALID_INSTRUCTION, showDate);
  }

  if (closestJournal && closestJournal.name) {
    logseq.App.pushState("page", { name: closestJournal.name });
  }
}

/**
 * Adaptive jump function that works on both journal pages and the OTD page
 * @param {string} showDate - Direction to jump: DIRECTION.PREVIOUS or DIRECTION.NEXT
 * @param {Function} getOnThisDay - Reference to the main getOnThisDay function
 * @returns {Promise<void>}
 * @example
 * await adaptiveJump(DIRECTION.PREVIOUS, getOnThisDay);
 * // Jumps to previous day on journal pages, or previous day's entries on OTD page
 */
export async function adaptiveJump(showDate, getOnThisDay) {
  const validatedSettings = validateSettings();
  const pageTitle = validatedSettings.pageTitle;
  //getCurrentPageType
  const currentPage = await logseq.Editor.getCurrentPage();
  const isCurrentPageJournal = currentPage["journal?"];
  const isCurrentPageOTD = currentPage["originalName"] == pageTitle ? true : false;

  if (isCurrentPageJournal) {
    jump(currentPage.journalDay, showDate);
  }
  else if (isCurrentPageOTD) {
    getOnThisDay(showDate);
  }
  else {
    return;
  }
}
