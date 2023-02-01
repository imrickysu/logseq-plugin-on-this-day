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

  console.log(date);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  // const dmy = `${day}/${month}/${year}`;

  var queryTimeString = '(or';

  for (var i=startingYear; i<year; i++) {
    const timeString = i + (month < 10 ? '0' : '') + month + (day < 10 ? '0' : '') + day
    queryTimeString += ` [(= ?d ${timeString})]`
  }
  queryTimeString += ")";
  console.log(queryTimeString)

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
  console.log(queryString)
  return (queryString);  
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
      // console.log(page.name)
      logseq.App.pushState("page", { name: page.name });
    }

    // get first block
    const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree();
    console.log("pageBlocksTree")
    console.log(pageBlocksTree)
    if (pageBlocksTree.length >= 1)  {
      // const dateBlock = await logseq.Editor.getBlock(pageBlocksTree[0][0]);
      const dateBlock = pageBlocksTree[0]
      console.log(dateBlock)
      dateOnPage = new Date(dateBlock.content)
      // const dateArray = dateBlock.content.split("/");
      // date = {day: dateArray[1], month: dateArray[0], year: dateArray[2]};
    } else {
      dateOnPage = null
    }

  
  }
  return {page: page, dateOnPage: dateOnPage}


}

async function cleanBlocksOnCurrentPage() {
  // remove all blocks on this page
  const pageBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()

  for (var i=0; i < pageBlocksTree.length; i++) {
    await logseq.Editor.removeBlock(pageBlocksTree[i].uuid);
  }

} 


async function generateOTDPage(date, page) {

  console.log("generateOTDPage()")
  console.log("date")
  console.log(date)

  const queryScriptOTD = getQueryScriptOTD(date);
  console.log("queryScriptOTD")
  console.log(queryScriptOTD)

  // add a lock for date

  const dateString = date.toISOString().split("T")[0];
  console.log("dateString")
  console.log(dateString)
  await logseq.Editor.appendBlockInPage(page.uuid, dateString);
  console.log("append date complete")

  // query for journals on this day
  let journal_query_ret = await logseq.DB.datascriptQuery(queryScriptOTD);
  console.log("journal_query_ret")
  console.log(journal_query_ret.length)
  console.log(journal_query_ret)

  if (journal_query_ret.length < 1) {
    // No journals found
    await logseq.Editor.appendBlockInPage(page.uuid, "No entries on this day");

  } else {
    // Some previous journals are found

    const query_ret_pages = journal_query_ret?.flat();
    console.log(query_ret_pages[0].name);

    // embed journel pages to this page
    // logseq.Editor.updateBlock(targetBlock.uuid, getQueryScriptOTD());
    for (var i=0; i < query_ret_pages.length; i++) {
      // await logseq.Editor.insertBlock(page.uuid, "{{embed [["+query_ret_pages[i].name+"]]}}")
      await logseq.Editor.appendBlockInPage(page.uuid, "{{embed [["+query_ret_pages[i].name+"]]}}");

    }

    // append an empty block to exit the edit mode
    await logseq.Editor.appendBlockInPage(page.uuid, "");

    // exit editing mode
    await logseq.Editor.exitEditingMode();
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
  //TODO
  // let previousDay = new Date(date.year, date.month - 1, date.day);
  // previousDay.setDate(previousDay.getDate() - 1);
  // return {day: "30", month: "1", year: "2023"}
  console.log("previousDay")
  console.log(date)

  let previous = new Date(date.getTime());
  previous.setDate(date.getDate() -1);

  console.log(previous)

  return previous;
}

function nextDay(date){
  //TODO
  console.log("nextDay")
  console.log(date)

  let next = new Date(date.getTime());
  next.setDate(date.getDate() + 1);

  console.log(next)

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

  console.log("on-this-day plugin loaded.")

  
  
  const pageTitle = logseq.settings.pageTitle;
  const today = new Date();


  

  try {
    // get the On This Day page and the date on this page
    const pageDate = await getOTDPage(); // hold the "On This Day" page no matter it's a new page or existing page
    const page = pageDate.page;
    const dateOnPage = pageDate.dateOnPage;

    console.log("page")
    console.log(page)
    console.log(page.uuid)
    console.log("dateOnPage")
    console.log(dateOnPage)


    // if dateOnPage == 0, geneate today
    // if dateOnPage == today , skip, return
    // if dateOnPage != today  
    //    case showDate = "Previous", generate previous day of dateOnPage
    //    case showDate = "Next", generate next day of dateOnpage
    //    case showDate = "Today", geneate today

    if (dateOnPage == null) {
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

function main() {
  logseq.provideModel({
    handleOnThisDay() {
      getOnThisDay("Today");
    },
    handlePrevious() {
      getOnThisDay("Previous");
    },
    handleNext() {
      getOnThisDay("Next");
    },
  });



  logseq.App.registerUIItem("toolbar", {
    key: "on-this-day-1",
    template: `
      <span class="on-this-day-previous">
        <a title="Previous" class="button" data-on-click="handlePrevious">
          <i class="ti ti-arrow-move-left"></i>
        </a>
      </span>
    `,
  });

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

  logseq.App.registerUIItem("toolbar", {
    key: "on-this-day-3",
    template: `
      <span class="on-this-day-next">
        <a title="next" class="button" data-on-click="handleNext">
          <i class="ti ti-arrow-move-right"></i>
        </a>
      </span>
    `,
  });


  // -----
  // change shortcut key later
  // -----

  // logseq.App.registerCommandPalette(
  //   {
  //     key: "logseq-random-note",
  //     label: "Random note => Let's go",
  //     keybinding: {
  //       mode: "non-editing",
  //       binding: "y t",
  //     },
  //   },
  //   () => {
  //     getOnThisDay();
  //   }
  // );

  logseq.App.registerCommandPalette(
    {
      key: "logseq-on-this-day-previous",
      label: "Generate journals on this day for previous day",
      keybinding: {
        mode: "non-editing",
        binding: "d p",
      },
    },
    () => {
      getOnThisDay("Previous");
    }
  );

  logseq.App.registerCommandPalette(
    {
      key: "logseq-on-this-day-next",
      label: "Generate journals on this day for next day",
      keybinding: {
        mode: "non-editing",
        binding: "d n",
      },
    },
    () => {
      getOnThisDay("Next");
    }
  );

}

// Run main function, catch errors in the end
logseq.ready(main).catch(console.error);
