/**
 * Service for page operations
 */

import { MESSAGES } from "../constants.js";
import { getQueryScriptOTD, getQueryScriptOTDPageID } from "../utils/queryBuilder.js";

/**
 * Retrieves or creates the "On This Day" page
 * @returns {Promise<{page: Object, dateOnPage: Date|null}>} Page object and current date displayed on the page
 * @throws {Error} If page cannot be created or accessed
 * @example
 * const { page, dateOnPage } = await getOTDPage();
 * if (dateOnPage === null) {
 *   // Page was just created
 * }
 */
export async function getOTDPage() {
  const pageTitle = logseq.settings.pageTitle;
  const queryScriptOTDPage = getQueryScriptOTDPageID();
  // get the On This Day page
  const queryResult = await logseq.DB.datascriptQuery(queryScriptOTDPage);
  let page;
  let dateOnPage = {};

  if (queryResult.length < 1) {
    // page does not exist

    // create page
    page = await logseq.Editor.createPage(pageTitle,{},{format: "markdown", journal: false, createFirstBlock: false});
    dateOnPage = null;

  } else {
    // page exists

    page = queryResult[0][0];

    // open page
    if (page && page.name) {
      logseq.App.pushState("page", { name: page.name });
    }

    // get first block
    const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();

    if (pageBlocksTree.length >= 1)  {
      const dateBlock = pageBlocksTree[0];
      dateOnPage = new Date(dateBlock.content);
    } else {
      dateOnPage = null;
    }
  }
  return {page: page, dateOnPage: dateOnPage};
}

/**
 * Removes all blocks from the current page
 * @returns {Promise<void>}
 * @example
 * await cleanBlocksOnCurrentPage();
 * // All blocks on the current page have been removed
 */
export async function cleanBlocksOnCurrentPage() {
  // remove all blocks on this page
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();

  for (let i=0; i < pageBlocksTree.length; i++) {
    await logseq.Editor.removeBlock(pageBlocksTree[i].uuid);
  }
}

/**
 * Populates the On This Day page with journal entries for a specific date
 * @param {Date} date - The date to generate entries for
 * @param {Object} page - The page object to populate
 * @returns {Promise<void>}
 * @example
 * await generateOTDPage(new Date(), page);
 * // Page is now populated with journal entries from this day in previous years
 */
export async function generateOTDPage(date, page) {
  const queryScriptOTD = getQueryScriptOTD(date);

  const dateString = date.toISOString().split("T")[0];
  await logseq.Editor.appendBlockInPage(page.uuid, dateString);

  // query for journals on this day
  const journal_query_ret = await logseq.DB.datascriptQuery(queryScriptOTD);

  if (journal_query_ret.length < 1) {
    // No journals found
    await logseq.Editor.appendBlockInPage(page.uuid, MESSAGES.NO_ENTRIES);

  } else {
    // Some previous journals are found

    const query_ret_pages = journal_query_ret?.flat();

    // embed journel pages to this page
    for (let i=0; i < query_ret_pages.length; i++) {
      await logseq.Editor.appendBlockInPage(page.uuid, "{{embed [["+query_ret_pages[i].name+"]]}}");
    }

    // append an empty block to exit the edit mode
    await logseq.Editor.appendBlockInPage(page.uuid, "");

    // exit editing mode and
    await logseq.Editor.exitEditingMode(true);
    const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
    logseq.Editor.scrollToBlockInPage(page.name, pageBlocksTree[0].uuid);
  }
}
