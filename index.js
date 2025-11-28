import "@logseq/libs";

// Constants
const DIRECTION = {
  PREVIOUS: "Previous",
  NEXT: "Next",
  TODAY: "Today"
};

const MESSAGES = {
  NO_ENTRIES: "No entries on this day",
  ERROR_QUERY: "Error generating On This Day page. Please check console for details.",
  INVALID_YEAR: "Invalid starting year: {year}. Must be between {min} and {max}. Using {default} as default.",
  EMPTY_TITLE: "Page title cannot be empty. Using 'On This Day' as default.",
  UNSUPPORTED_DIRECTION: "Error: Unsupported date direction:",
  INVALID_SHOWDATE: "Error: OTD: Invalid showDate value:",
  INVALID_INSTRUCTION: "Error: Invalid showDate instruction:"
};

const DEFAULTS = {
  STARTING_YEAR: "2010",
  PAGE_TITLE: "On This Day",
  MIN_YEAR: 1900
};

const settingsTemplate = [
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

logseq.useSettingsSchema(settingsTemplate);

/**
 * Validates plugin settings and returns corrected values if needed
 * @returns {{isValid: boolean, startingYear: string, pageTitle: string}} Validated settings object
 * @example
 * const validated = validateSettings();
 * if (!validated.isValid) {
 *   // Settings were corrected, warnings shown to user
 * }
 */
function validateSettings() {
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



/**
 * Generates a Datalog query to find journal pages created on this day in previous years
 * @param {Date} date - The target date to query for
 * @returns {string} A Datalog query string for finding journals on this day across years
 * @example
 * const query = getQueryScriptOTD(new Date('2023-01-26'));
 * // Returns query for all journals on January 26th from startingYear to 2023
 */
function getQueryScriptOTD(date) {
  const validatedSettings = validateSettings();
  const startingYear = validatedSettings.startingYear;

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  // const dmy = `${day}/${month}/${year}`;

  let queryTimeString = "(or";

  for (let i=startingYear; i<=year; i++) {
    const timeString = i + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
    queryTimeString += ` [(= ?d ${timeString})]`;
  }
  queryTimeString += ")";

  // queryTimeString example: (or [(= ?d 20100126)] [(= ?d 20110126)] [(= ?d 20120126)] [(= ?d 20130126)] [(= ?d 20140126)] [(= ?d 20150126)] [(= ?d 20160126)] [(= ?d 20170126)] [(= ?d 20180126)] [(= ?d 20190126)] [(= ?d 20200126)] [(= ?d 20210126)] [(= ?d 20220126)])

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
function getQueryScriptOTDPageID() {
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
function getQueryScriptPN(journalDate, showDate) {
  // generate query string for all journal before or after journalDate

  // const day = date.getDate();
  // const month = date.getMonth() + 1;
  // const year = date.getFullYear();
  // const dmy = `${day}/${month}/${year}`;

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

  // queryTimeString example: (or [(= ?d 20100126)] [(= ?d 20110126)] [(= ?d 20120126)] [(= ?d 20130126)] [(= ?d 20140126)] [(= ?d 20150126)] [(= ?d 20160126)] [(= ?d 20170126)] [(= ?d 20180126)] [(= ?d 20190126)] [(= ?d 20200126)] [(= ?d 20210126)] [(= ?d 20220126)])

  // [:find (pull ?b [*])
  // :in $ ?current-page ?start ?today
  // :where
  // [?b :block/page ?p]
  // [?p :page/journal? true]
  // [?p :page/journal-day ?d]
  
  //  [(< ?d 20230111)]

  // ]


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
 * Retrieves or creates the "On This Day" page
 * @returns {Promise<{page: Object, dateOnPage: Date|null}>} Page object and current date displayed on the page
 * @throws {Error} If page cannot be created or accessed
 * @example
 * const { page, dateOnPage } = await getOTDPage();
 * if (dateOnPage === null) {
 *   // Page was just created
 * }
 */
async function getOTDPage() {
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
      // const dateBlock = await logseq.Editor.getBlock(pageBlocksTree[0][0]);
      const dateBlock = pageBlocksTree[0];
      dateOnPage = new Date(dateBlock.content);
      // const dateArray = dateBlock.content.split("/");
      // date = {day: dateArray[1], month: dateArray[0], year: dateArray[2]};
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
async function cleanBlocksOnCurrentPage() {
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
async function generateOTDPage(date, page) {

  const queryScriptOTD = getQueryScriptOTD(date);

  // add a lock for date

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
    // logseq.Editor.updateBlock(targetBlock.uuid, getQueryScriptOTD());
    for (let i=0; i < query_ret_pages.length; i++) {
      // await logseq.Editor.insertBlock(page.uuid, "{{embed [["+query_ret_pages[i].name+"]]}}")
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


/**
 * Gets today's date as a dictionary object
 * @returns {{year: number, month: number, day: number}} Today's date components
 * @example
 * const today = getTodayDict();
 * // { year: 2023, month: 1, day: 26 }
 */
function getTodayDict() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth()+1;
  const year = date.getFullYear();
  return {year: year, month: month, day:day};
}

/**
 * Returns the previous day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the previous day
 * @example
 * const yesterday = previousDay(new Date('2023-01-26'));
 * // Returns Date for January 25, 2023
 */
function previousDay(date) {

  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() -1);

  return previous;
}

/**
 * Returns the next day from the given date
 * @param {Date} date - The reference date
 * @returns {Date} A new Date object representing the next day
 * @example
 * const tomorrow = nextDay(new Date('2023-01-26'));
 * // Returns Date for January 27, 2023
 */
function nextDay(date){

  const next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);

  return next;
}

/**
 * Main function to generate or navigate the On This Day page
 * @param {string} showDate - Direction to show: DIRECTION.TODAY, DIRECTION.PREVIOUS, or DIRECTION.NEXT
 * @returns {Promise<void>}
 * @throws {Error} If page generation fails
 * @example
 * await getOnThisDay(DIRECTION.TODAY);
 * // Generates the On This Day page for today
 *
 * await getOnThisDay(DIRECTION.PREVIOUS);
 * // Shows the previous day if already on the OTD page
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

    // if dateOnPage == 0, geneate today
    // if dateOnPage == today , skip, return
    // if dateOnPage != today  
    //    case showDate = "Previous", generate previous day of dateOnPage
    //    case showDate = "Next", generate next day of dateOnpage
    //    case showDate = "Today", geneate today

    if (dateOnPage == null) {
      // new page
      await generateOTDPage(today, page);
    } else if (dateOnPage.getFullYear() == today.getFullYear() &&
              dateOnPage.getMonth()     == today.getMonth() &&
              dateOnPage.getDate()      == today.getDate()) {
      return;
    } else {
      switch (showDate) {
      case DIRECTION.PREVIOUS:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(previousDay(dateOnPage), page);
        break;
      case DIRECTION.NEXT:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(nextDay(dateOnPage), page);
        break;
      case DIRECTION.TODAY:
        await cleanBlocksOnCurrentPage();
        await generateOTDPage(today, page);
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
 * Jumps to the nearest journal page in the specified direction
 * @param {number} journalDay - Current journal day in YYYYMMDD format
 * @param {string} showDate - Direction to jump: DIRECTION.PREVIOUS or DIRECTION.NEXT
 * @returns {Promise<void>}
 * @example
 * await jump(20230126, DIRECTION.PREVIOUS);
 * // Navigates to the most recent journal before January 26, 2023
 */
async function jump(journalDay, showDate)
{
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
 * @returns {Promise<void>}
 * @example
 * await adaptiveJump(DIRECTION.PREVIOUS);
 * // Jumps to previous day on journal pages, or previous day's entries on OTD page
 */
async function adaptiveJump(showDate)
{
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




/**
 * Main entry point for the plugin
 * Registers event handlers and UI elements
 * @returns {void}
 */
function main() {
  // Validate settings on startup
  const validatedSettings = validateSettings();

  const enableJump = logseq.settings.enableJump;
  const jumpButtonPosition = logseq.settings.jumpButtonPosition;

  // Register model
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

  // register UI
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

} // end of main()

// Run main function, catch errors in the end
logseq.ready(main).catch(console.error);
