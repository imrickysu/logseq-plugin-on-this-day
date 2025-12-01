import "@logseq/libs";

// Import modules
import { DIRECTION, MESSAGES } from "./src/constants.js";
import { settingsTemplate, validateSettings } from "./src/settings.js";
import { previousDay, nextDay } from "./src/utils/dateUtils.js";
import { getOTDPage, cleanBlocksOnCurrentPage, generateOTDPage } from "./src/services/pageService.js";
import { jump, adaptiveJump as adaptiveJumpService } from "./src/services/journalService.js";
import { registerModel, registerUIButtons } from "./src/ui/buttonRegistry.js";

// Initialize settings schema
logseq.useSettingsSchema(settingsTemplate);

/**
 * Main function to generate or navigate the On This Day page
 * @param {string} showDate - Direction to show: DIRECTION.TODAY, DIRECTION.PREVIOUS, or DIRECTION.NEXT
 * @returns {Promise<void>}
 * @throws {Error} If page generation fails
 * @example
 * await getOnThisDay(DIRECTION.TODAY);
 * // Always regenerates the On This Day page with today's entries
 * // This allows users to refresh and see updated journal content
 *
 * await getOnThisDay(DIRECTION.PREVIOUS);
 * // Shows the previous day from the currently displayed date
 */
async function getOnThisDay(showDate) {
  const validatedSettings = validateSettings();
  const pageTitle = validatedSettings.pageTitle;
  const today = new Date();

  try {
    // get the On This Day page and the date on this page
    const otdPageData = await getOTDPage(); // hold the "On This Day" page no matter it's a new page or existing page
    const page = otdPageData.page;
    const dateOnPage = otdPageData.dateOnPage;

    // Determine what action to take based on current state and requested direction
    const isShowingToday = dateOnPage &&
                          dateOnPage.getFullYear() === today.getFullYear() &&
                          dateOnPage.getMonth() === today.getMonth() &&
                          dateOnPage.getDate() === today.getDate();

    // If page is new (no date), generate today's entries
    if (dateOnPage == null) {
      await generateOTDPage(today, page);
      return;
    }

    // If showing TODAY is requested, always regenerate to get latest journal updates
    if (showDate === DIRECTION.TODAY) {
      await cleanBlocksOnCurrentPage();
      await generateOTDPage(today, page);
      return;
    }

    // For PREVIOUS/NEXT navigation: if already showing today and navigating away, proceed
    // If showing today and trying to navigate to today, we already handled it above
    if (isShowingToday) {
      // Navigate to previous or next day from today
      switch (showDate) {
      case DIRECTION.PREVIOUS:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(previousDay(dateOnPage), page);
        break;
      case DIRECTION.NEXT:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(nextDay(dateOnPage), page);
        break;
      default:
        console.error(MESSAGES.INVALID_SHOWDATE, showDate);
      }
    } else {
      // Not showing today, navigate based on direction
      switch (showDate) {
      case DIRECTION.PREVIOUS:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(previousDay(dateOnPage), page);
        break;
      case DIRECTION.NEXT:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(nextDay(dateOnPage), page);
        break;
      default:
        console.error(MESSAGES.INVALID_SHOWDATE, showDate);
      }
    }

  } catch (err) {
    logseq.App.showMsg(
      err.message || MESSAGES.ERROR_QUERY,
      "error"
    );
    console.error("On This Day error:", err);
  }
}

/**
 * Wrapper for adaptiveJump that provides the getOnThisDay reference
 * @param {string} showDate - Direction to jump: DIRECTION.PREVIOUS or DIRECTION.NEXT
 * @returns {Promise<void>}
 */
async function adaptiveJump(showDate) {
  return adaptiveJumpService(showDate, getOnThisDay);
}

/**
 * Main entry point for the plugin
 * Registers event handlers and UI elements
 * @returns {void}
 */
function main() {
  // Validate settings on startup
  validateSettings();

  const enableJump = logseq.settings.enableJump;
  const jumpButtonPosition = logseq.settings.jumpButtonPosition;

  // Register event handlers
  registerModel(getOnThisDay, adaptiveJump);

  // Register UI buttons
  registerUIButtons(enableJump, jumpButtonPosition);
}

// Run main function, catch errors in the end
logseq.ready(main).catch(console.error);
