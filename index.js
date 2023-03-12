import "@logseq/libs";

const settingsTemplate = [
  {
    key: "startingYear",
    type: 'string',
    default: "2010",
    title: "Starting Year for the On This Day page.",
    description: "On This Day page will List the journals starting from this year. Journals before this year will be skipped."
  },
  {
    key: "pageTitle",
    type: 'string',
    default: "On This Day",
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





/*
* getQueryScriptOTD()
* This function generates the query string to find the On This Day page
*/
function getQueryScriptOTD(date) {
  const startingYear = logseq.settings.startingYear;
  //TODO: check this string is a valid string for year and should be smaller than the current year

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  // const dmy = `${day}/${month}/${year}`;

  var queryTimeString = '(or';

  for (var i=startingYear; i<=year; i++) {
    const timeString = i + (month < 10 ? '0' : '') + month + (day < 10 ? '0' : '') + day
    queryTimeString += ` [(= ?d ${timeString})]`
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
  )
}

/*
* getQueryScriptOTDPageID()
* This function generates the query string to find the pages that were created on this day in previous years.
* Note: Today this year is not included.
*/
function getQueryScriptOTDPageID() {
  const pageTitle = logseq.settings.pageTitle;
  const pageTitleLowerCase = logseq.settings.pageTitle.toLowerCase();

  const blockNameQueryString = `[?p :block/name "` + pageTitleLowerCase + `"]`;
  
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

function getQueryScriptPN(journalDate, showDate) {
  // generate query string for all journal before or after journalDate

  // const day = date.getDate();
  // const month = date.getMonth() + 1;
  // const year = date.getFullYear();
  // const dmy = `${day}/${month}/${year}`;

  var instruction;
  if (showDate == "Previous") {
    instruction = "<"; 
  } 
  else if (showDate == "Next") {
    instruction = ">";
  }
  else {
    console.log("error: unsupported date");
    return
  }

  var queryTimeString = `[(${instruction} ?d ${journalDate})]`;
  console.log(queryTimeString)

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
  )
}

/*
* 
* return
* - page
* - dateOnPage
*/
async function getOTDPage() {
  const pageTitle = logseq.settings.pageTitle;
  const queryScriptOTDPage = getQueryScriptOTDPageID();
  // get the On This Day page
  let ret = await logseq.DB.datascriptQuery(queryScriptOTDPage);
  var page;
  var dateOnPage = {};
    
  if (ret.length < 1) {
    // page does not exist
    
    // create page
    page = await logseq.Editor.createPage(pageTitle,{},{format: "markdown", journal: false, createFirstBlock: false});
    dateOnPage = null

  } else {
    // page exists

    page = ret[0][0];

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

async function cleanBlocksOnCurrentPage() {
  // remove all blocks on this page
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();

  for (var i=0; i < pageBlocksTree.length; i++) {
    await logseq.Editor.removeBlock(pageBlocksTree[i].uuid);
  }

} 


async function generateOTDPage(date, page) {

  const queryScriptOTD = getQueryScriptOTD(date);

  // add a lock for date

  const dateString = date.toISOString().split("T")[0];
  await logseq.Editor.appendBlockInPage(page.uuid, dateString);

  // query for journals on this day
  let journal_query_ret = await logseq.DB.datascriptQuery(queryScriptOTD);

  if (journal_query_ret.length < 1) {
    // No journals found
    await logseq.Editor.appendBlockInPage(page.uuid, "No entries on this day");

  } else {
    // Some previous journals are found

    const query_ret_pages = journal_query_ret?.flat();

    // embed journel pages to this page
    // logseq.Editor.updateBlock(targetBlock.uuid, getQueryScriptOTD());
    for (var i=0; i < query_ret_pages.length; i++) {
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


function getTodayDict() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth()+1;
  const year = date.getFullYear();
  return {year: year, month: month, day:day}
}

/*
* date: Date() object
*/
function previousDay(date) {

  let previous = new Date(date.getTime());
  previous.setDate(date.getDate() -1);

  return previous;
}

function nextDay(date){

  let next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);

  return next;
}

/*
* getOnThisDay(date)
* The main function to generate contents on the On This Day page
*
* date:
* - "Previous"
* - "Next"
* - "Today"
*/
async function getOnThisDay(showDate) {

  const pageTitle = logseq.settings.pageTitle;
  const today = new Date();

  try {
  
    // get the On This Day page and the date on this page
    const pageDate = await getOTDPage(); // hold the "On This Day" page no matter it's a new page or existing page
    const page = pageDate.page;
    const dateOnPage = pageDate.dateOnPage;

    // if dateOnPage == 0, geneate today
    // if dateOnPage == today , skip, return
    // if dateOnPage != today  
    //    case showDate = "Previous", generate previous day of dateOnPage
    //    case showDate = "Next", generate next day of dateOnpage
    //    case showDate = "Today", geneate today

    if (dateOnPage == null) {
      // new page
      await generateOTDPage(today, page)
    } else if (dateOnPage.getFullYear() == today.getFullYear && 
              dateOnPage.getMonth()     == today.getMonth() && 
              dateOnPage.getDate()      == today.getDate()) {
      return
    } else {
      switch (showDate) {
        case "Previous":
          await cleanBlocksOnCurrentPage();
          await generateOTDPage(previousDay(dateOnPage), page);
          break;
        case "Next":
          await cleanBlocksOnCurrentPage();
          await generateOTDPage(nextDay(dateOnPage), page);
          break;
        case "Today":
          await cleanBlocksOnCurrentPage();
          await generateOTDPage(today, page);
          break;
        default:
          console.log("Error: OTD: Should not enter this branch");
      }
    }
      

  } catch (err) {
    logseq.App.showMsg(
      err.message || "Maybe something wrong with the query",
      "error"
    );
    console.log(err);
  }
}

async function jump(journalDay, showDate)
{
  // assume this is a journal page
  // show the previous journal or next journal of journalDay according to showDate
  // journalDay format 20230123
  const queryString = getQueryScriptPN(journalDay, showDate);
  let jump_query_ret = await logseq.DB.datascriptQuery(queryString);
 
  const journals = jump_query_ret?.flat();
  
  var tmpJournal;
  if (showDate == "Previous") {
    tmpJournal = journals.reduce((tmpJournal, currentJournal) => {
    if (currentJournal["journal-day"] > tmpJournal["journal-day"]) {
      return currentJournal;
    }
    return tmpJournal;
    });
  } else if (showDate == "Next") {
    tmpJournal = journals.reduce((tmpJournal, currentJournal) => {
      if (currentJournal["journal-day"] < tmpJournal["journal-day"]) {
        return currentJournal;
      }
      return tmpJournal;
      });
  } else {
    console.log("Error: wrong showDate instruction");
  }

  if (tmpJournal && tmpJournal.name) {
    logseq.App.pushState("page", { name: tmpJournal.name });
  }


}


async function adaptiveJump(showDate)
{
  const pageTitle = logseq.settings.pageTitle;
  //getCurrentPageType
  const currentPage = await logseq.Editor.getCurrentPage();
  const curPageIsJournal = currentPage["journal?"];
  const curPageIsOTD = currentPage["originalName"] == pageTitle ? true : false;

  if (curPageIsJournal) {
    jump(currentPage.journalDay, showDate);
  }
  else if (curPageIsOTD) {
    getOnThisDay(showDate);
  }
  else {
    return;
  }


}




function main() {
  const enableJump = logseq.settings.enableJump;
  const jumpButtonPosition = logseq.settings.jumpButtonPosition;

  // Register model
  logseq.provideModel({
    handleOnThisDay() {
      getOnThisDay("Today");
    },
    handlePrevious() {
      // getOnThisDay("Previous");
      adaptiveJump("Previous");
    },
    handleNext() {
      // getOnThisDay("Next");
      adaptiveJump("Next");
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

  // register shortcut keys
  logseq.App.registerCommandPalette(
    {
      key: "logseq-on-this-day-previous",
      label: "Generate journals on this day for previous day",
    },
    () => {
      adaptiveJump("Previous");
    }
  );

  logseq.App.registerCommandPalette(
    {
      key: "logseq-on-this-day-next",
      label: "Generate journals on this day for next day",
    },
    () => {
      adaptiveJump("Next");
    }
  );

} // end of main()

// Run main function, catch errors in the end
logseq.ready(main).catch(console.error);
