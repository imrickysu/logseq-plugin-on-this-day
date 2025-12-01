/**
 * UI button registration and event handlers
 */

import { DIRECTION } from "../constants.js";

/**
 * Registers the event handler model for UI buttons
 * @param {Function} getOnThisDay - Main function to display On This Day page
 * @param {Function} adaptiveJump - Function to jump between dates
 * @returns {void}
 * @example
 * registerModel(getOnThisDay, adaptiveJump);
 */
export function registerModel(getOnThisDay, adaptiveJump) {
  logseq.provideModel({
    handleOnThisDay() {
      getOnThisDay(DIRECTION.TODAY);
    },
    handlePrevious() {
      adaptiveJump(DIRECTION.PREVIOUS);
    },
    handleNext() {
      adaptiveJump(DIRECTION.NEXT);
    },
  });
}

/**
 * Registers UI buttons based on plugin settings
 * @param {boolean} enableJump - Whether to enable Previous/Next jump buttons
 * @param {string} jumpButtonPosition - Where to place jump buttons ("pagebar" or "toolbar")
 * @returns {void}
 * @example
 * registerUIButtons(true, "pagebar");
 */
export function registerUIButtons(enableJump, jumpButtonPosition) {
  // Register Previous button if jump is enabled
  if (enableJump) {
    logseq.App.registerUIItem(jumpButtonPosition, {
      key: "on-this-day-1",
      template: `
        <span class="on-this-day-previous">
          <a title="Previous" class="button" data-on-click="handlePrevious">
            <i class="ti ti-arrow-move-left"></i>
          </a>
        </span>
      `,
    });
  }

  // Register main On This Day button (always in toolbar)
  logseq.App.registerUIItem("toolbar", {
    key: "on-this-day-2",
    template: `
      <span class="on-this-day">
        <a title="On This Day" class="button" data-on-click="handleOnThisDay">
          <i class="ti ti-building-monument"></i>
        </a>
      </span>
    `,
  });

  // Register Next button if jump is enabled
  if (enableJump) {
    logseq.App.registerUIItem(jumpButtonPosition, {
      key: "on-this-day-3",
      template: `
        <span class="on-this-day-next">
          <a title="Next" class="button" data-on-click="handleNext">
            <i class="ti ti-arrow-move-right"></i>
          </a>
        </span>
      `,
    });
  }
}
