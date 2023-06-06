/*
// =================================================================
// FILE:        popup.html
// DATE:        2023-06-02 5:00 am PDT
// Copyright:   Nina Molinari 2023 (c)
//
// PROJECT:     "Keeping Tabs" Browser Plugin
//              (originally named "Smart Links")
//              I need a way to "keep tabs" on my tasks and work time, web resources, etc.
//              So, hence, I am building my own Tasks/Tabs/WebLinks tracker.
//
// VERSION:     00.01.13
//
// IMPLEMENTED:
//              - Task object added new features, task schema changed
//              -
//
// CHANGES:
//              6/2/23 3:00: task object schema change: elapsedTime is now TotalTimeSpent
//
// TODO:
//              -       Add selection of time window for filtering displays
//              -       Add support for cli commands in search bar...
//              -       add option to save open tabs
//              -       add option to edit a task
//              -       select task for changing status to "completed"
//              -       implemet "change status of task to completed"
//              -       Search in tasks
//              -       Save / Load tasks
//              -       Save / Load tabs
//              -       Save / Load favorites
//              -       Load file with custom browsing history
//              -       ...
//              -       data storage for subscribers
// =================================================================
*/
// DOM elements

// Planning on splitting this file and the Import the required modules
//
// import { searchHistory } from './history.js';
// import { searchTabs } from './tabs.js';
// import { TaskTracker } from './task-tracker.js';
// import { searchFavorites } from './favorites.js';

// Search block
var eBtnSearch        = document.getElementById('btnSearch');
var eBtnClear         = document.getElementById('btnClear');
var eBtnSave          = document.getElementById('btnSave');
var eBtnLoad          = document.getElementById('btnLoad');

// Task timer block
var taskNameInput     = document.getElementById('task-name-input');
var timerElement      = document.getElementById('timer');
var eBtnTimerStart    = document.getElementById('btnTimerStart');
var eBtnTimerPause    = document.getElementById('btnTimerPause');
var eBtnTimerResume   = document.getElementById('btnTimerPause');
var eBtnTimerEnd      = document.getElementById('btnTimerEnd');
var eBtnEdit          = document.getElementById('btnTaskEdit');

var taskList          = document.getElementById('task-list');

// Search block
var tableBody         = document.getElementById('tblSearchResults');
var searchInput       = document.getElementById('searchString');
var divSearchResults  = document.getElementById('div_SearchResults');
var divSearchSummary  = document.getElementById('div_SearchSummary');

// Local vars

let myTasks           = [];     // Array to store task data objects
let gRunningTask      = null;
let activeTask        = null;   // Currently active task
let gTimerInterval;             // Timer interval reference
let gStartTime;

var gSearchMode       = "mode_SearchTabs"; // (other optioons: mode_SearchFavs, mode_SearchHist, ...)
var gLinkDisplayMode  = "mode_Display_TITLE";
var gTimerTask        = "";
var gTimerState       = "timer_stopped";// "timer_paused"; "timer_running";
var gInfoDisplayStr   = "INFO: ";
var gTabsCountString  = "";
var gTotalOpenWindows = 0;
var gTotalOpenTabs    = 0;
var gMatchedTabs      = 0;
var bSupplINFO        = true;
var gTaskSchemaVer    = "1.02";

// ========================================================================
function formatDate (date) {
  // ========================================================================
  // console.log(`formatDate:${date}`);
      curYear       = new Date().getFullYear(); //Date(now)  ;// let date =  new Date().getFullYear();
      nDate         = new Date(date);
      const year    = nDate.getFullYear();
      const month   = (nDate.getMonth() + 1).toString().padStart(2, '0');
      const day     = nDate.getDate().toString().padStart(2, '0');
      const hours   = nDate.getHours().toString().padStart(2, '0');
      const minutes = nDate.getMinutes().toString().padStart(2, '0');
      const seconds = nDate.getSeconds().toString().padStart(2, '0');

      if (year - curYear < 0) {
         return (`${year}.${month}.${day} ${hours}:${minutes}`);
      } else {
         return (`'${month}/${day} ${hours}:${minutes}`);
      }
};

// ========================================================================
// Clear Popup window from previously displayed information
// ========================================================================
function ClearAll() {
  tableBody.innerHTML         = '';
  divSearchResults.innerHTML  = '';
  divSearchSummary.innerHTML  = ':';
  //
  eBtnTimerStart.disabled     = false;
  eBtnTimerPause.disabled     = true;
  eBtnTimerResume.disabled    = true;
  eBtnTimerEnd.disabled       = true;
  eBtnEdit.disabled           = true;
  //
  activeTask=null;
  // updateTimer();
  timerElement.textContent    = '00:00:00';
  taskNameInput.value         = '';
  //

}

// =================================================================
function _SelectSearchMode(search_mode) {
  // ========================================================================
    switch (search_mode) {
      case "mSearchTabs":
        gSearchMode="mode_SearchTabs";
        eBtnSearch.disabled = eBtnClear.disabled  = false;
        eBtnSave.disabled   = eBtnLoad.disabled   = true;
        break;
      case "mSearchFavs":
        gSearchMode="mode_SearchFavs";
        eBtnSearch.disabled = eBtnClear.disabled  = false;
        eBtnSave.disabled   = eBtnLoad.disabled   = true;
        break;
      case "mSearchHist":
        gSearchMode="mode_SearchHist";
        eBtnSearch.disabled = eBtnClear.disabled  = eBtnSave.disabled = false;
        eBtnLoad.disabled   = true;
        break;
      case "mSearchTasks":
        gSearchMode="mode_SearchTasks";
        eBtnSearch.disabled = eBtnClear.disabled  = eBtnSave.disabled = false;
        eBtnLoad.disabled   = true;
        break;
      case "mSearchTags":
        gSearchMode="mode_SearchTags";
        eBtnSearch.disabled = eBtnClear.disabled  = false;
        eBtnSave.disabled   = eBtnLoad.disabled   = true;
        break;
    }

    bSupplINFO == true && (divSearchSummary.innerHTML = (`INFO: Search Mode:<b> ${search_mode} </b>`));
}

// =================================================================
function _SelectLinkDisplayhMode(display_mode) {
  // =================================================================
  (display_mode == "mDisplayURL") && (gLinkDisplayMode="mode_Display_URL");
  (display_mode == "mDisplayTITLE") && (gLinkDisplayMode="mode_Display_TITLE");
  (bSupplINFO == true) && (divSearchSummary.innerHTML = (`INFO: Display Mode:<b> ${display_mode} </b>`));
}

// ========================================================================
function _PopupInitialize() {
  // =================================================================
  var runningTask=null;

  // Update UI
  eBtnTimerStart.disabled  = false;
  eBtnTimerPause.disabled  = true;
  eBtnTimerResume.disabled = true;
  eBtnTimerEnd.disabled    = true;
  eBtnEdit.disabled        = true;

  _UpdatePluginIcon();

  myTasks.forEach((task) => {
      if (task.state.includes('running')) {
          activeTask = task;
          resumeTimer();
          return;
      }
  });
}

// ========================================================================
// Updates Plugin icon with the current count of "Windows:Tabs"
// ========================================================================
function _UpdatePluginIcon() {
  _CollectTabsInfo();
  chrome.action.setBadgeText({text: '' + `${gTotalOpenWindows}:${gTotalOpenTabs}`});
}

// ========================================================================
// Collects info on open browser Windows and Tabs and updates
// Plugin Icons with the current count of "Windows:Tabs"
// ========================================================================
function _CollectTabsInfo() {
  chrome.windows.getAll({populate: true}, function(windows) {
    gTotalOpenWindows = windows.length;
    total_tabs        = 0;
    active_tabs       = 0;
    tabs_count_string = '( ';

    console.log ("popup.js: _CollectTabsInfo(): Total Windows: " + windows.length);

    windows.forEach( function(window) {
        total_tabs += window.tabs.length;

        if (window.focused) {
          tabs_count_string += '<b>'+ window.tabs.length  + '</b> ; ';
          console.log ("popup.js: _CollectTabsInfo(): Tabs in Focused Window: " + window.tabs.length);
        }
        else {
          tabs_count_string += window.tabs.length + ' ; ';
          console.log ("popup.js: _CollectTabsInfo(): Tabs in UnFocused Window: " + window.tabs.length);
        }
        window.tabs.forEach(function(_tab) {
          // chrome.runtime.sendMessage({command: "displayUrls", urls: urls});
          // Collect detailed information about each tab here
        });
    }); // =====> end of windows.forEach()

    gTotalOpenTabs = total_tabs;
    tabs_count_string += " )";
    gTabsCountString = tabs_count_string;

    chrome.action.setBadgeText({text: '' + `${gTotalOpenWindows}:${gTotalOpenTabs}`});
    console.log (`popup.js: _CollectTabsInfo(): W=${gTotalOpenWindows},T=${gTotalOpenTabs}`);
    divSearchSummary.innerHTML = (`TABS: ${gTotalOpenTabs} in ${gTotalOpenWindows} Windows:  (${gTabsCountString})<br>`);
  }); // =======> end of chrome.windows.getAll()
}

// ========================================================================
function _PerformSearch() {
// ========================================================================
    (gSearchMode == "mode_SearchTabs")  && _SearchTabs(searchInput.value);
    (gSearchMode == "mode_SearchHist")  && _SearchHist(searchInput.value);
    (gSearchMode == "mode_SearchFavs")  && searchFavorites(searchInput.value); //_SearchFavs(
    (gSearchMode == "mode_SearchTasks") && _SearchTasks(searchInput.value);
}

// ========================================================================
function _SearchTabs(search_pattern) {
// ========================================================================
    var tabUrls      = [];
    var tabTitles    = [];
    var nMatchedTabs = 0;

    chrome.tabs.query({}, function(tabs) {

      for (var i = 0; i < tabs.length; i++) {
        // foundTabs.push(tabs[i]);
        tabUrls.push  (tabs[i].url);
        tabTitles.push(tabs[i].title);
      }

      var searchText    = search_pattern; //searchInput.value;
      var matchingUrls  = [];
      var matchingTabs  = [];
      foundTabs         = [];

      ClearAll();

      bSupplINFO && (divSearchSummary.innerHTML = (`INFO: Search Mode:<b> ${gSearchMode} </b>`));

      for (var i = 0; i < tabUrls.length; i++) {
        // Search within URL strings
        if (tabUrls[i].indexOf(searchText) !== -1) {
          matchingUrls.push(tabUrls[i]);
          matchingTabs.push(tabs[i]);
          continue;
        }
        // Search within Tab titles
        if (tabTitles[i].indexOf(searchText) !== -1) {
          matchingUrls.push(tabUrls[i]);
          matchingTabs.push(tabs[i]);
        }
      }

      tCount = 0;
      linkText = '';

      matchingTabs.forEach (function (mTab) {
        tCount +=1 ;
        var tr = document.createElement('tr');
        // console.log( " original: " + tCount ":" +  mTab.title );
        // console.log( ` original: ${tCount} :  ${mTab.title}` );
        cTitle = mTab.title.replace(/</g,"&lt;");
        if (gLinkDisplayMode == 'mode_Display_TITLE') {
          linkText = cTitle;
        }else{
          linkText = mTab.url.substring(0,78) ;
        }
        tr.innerHTML = '<td> (' + tCount + ')</td><td width="400"><a href=' + mTab.url + '>[' + linkText + ']</a></td>';
        tableBody.appendChild(tr);
      });
      gMatchedTabs = matchingTabs.length;
      divSearchSummary.innerHTML = (`INFO: ${gMatchedTabs} tabs matched out of ${tabs.length}`);
  });
}

// ========================================================================
function _SearchHist(search_pattern) {
  // ========================================================================
  ClearAll();
  var AllVisitedPages   = [];
  var matchedPages      = [];
  var matchedPageURLs   = [];
  var matchedPageTitles = [];
  var total_HistPages   = 0;

  chrome.history.search( {text: '', startTime: 0, maxResults: 0}, function(visited_pages) {
      // items => console.log(items));
      tableBody.innerHTML = '';
      total_HistPages     = visited_pages.length;
      var current_count   = 0;
      var linkText        = '';

      visited_pages.forEach(function(page) {
          // console.log(page);
          var tr        = document.createElement('tr');
          var date      = new Date(page.lastVisitTime);
          //var time    = date.toLocaleString();
          var time      = formatDate(date);
          var mLink     = '';
          current_count += 1;

          if ((page.url.indexOf(search_pattern) !== -1) || (page.title.indexOf(search_pattern) !== -1)) {
              matchedPageURLs.push(page.url);
              matchedPageTitles.push(page.title);
              matchedPages.push({Url:page.url, Title: page.title});

              linkText = ((page.title != '')? page.title:page.url).substring(0,72) ;
              // Adjusting for Japanese characters: see examples below
              // or check hiragana full size /^[ぁ-ん]+$/
              // see more options at the end: [7].
              if ( linkText.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/) ) {
                 linkText = `[ ${(page.url).substring(0,50)}]`;
              }
              mLink    = linkText.replace(/</g,"&lt;");
              tr.innerHTML = '<td>' + current_count + '</td><td>[' + time + ']</td><td><a href=' + page.url + '>' + mLink + '</a></td>';
              tableBody.appendChild(tr);
          }
      });

      divSearchSummary.innerHTML = (`INFO: Total found: ${matchedPages.length} out of ${visited_pages.length} URLs visits in browsing history`);
      console.log("Total Matched Hist Pages: " + matchedPages.length);
  });
} // end of function _SearchHist()

// ========================================================================
function _SearchTasks(){
  // ========================================================================
  if (gSearchMode == "mode_SearchTasks") {
    tableBody.innerHTML = '';
    renderTaskList();
  }
}

// ========================================================================
function _Save() {
  // ========================================================================
  switch (gSearchMode) {
    case "mode_SearchTasks":
      _saveTasksToFile();
      break;
    case "mode_SearchHist":
      _SaveHistory();
      break;
  }
 // _SaveHistory();
  console.log("Fn(_Save): Saving data...");
}

// ========================================================================
// function _SaveHistory(callback) {
function _SaveHistory() {
  // ========================================================================
  chrome.history.search({text: '', startTime: 0, maxResults: 0}, function(data) {
    // console.log(`data: ${data}` );
   data.forEach(function(page) {
     page.lastVisitTime = new Date(page.lastVisitTime).toLocaleString('en-US', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });
     // console.log(page);
   });

   var jsonData = JSON.stringify(data, null, 2); // improved json formatting vs. JSON.stringify(data);
   var blob = new Blob([jsonData], {type: 'application/json'});
   var url = URL.createObjectURL(blob);

   // Open "Save as" dialog window
   chrome.downloads.download({ url: url, filename: 'Browsing_history.json', saveAs: true});
 });
}

//   // myTasks.array.forEach(element => {

// ========================================================================
// Function to save tasks data to a file in JSON format
// ========================================================================
function _saveTasksToFile() {
  // Convert tasks array to JSON string
  const jsonData = JSON.stringify(myTasks, null, 2); // Use null and 2 for pretty-printing

  // Create a blob with the JSON data
  const blob = new Blob([jsonData], { type: 'application/json' });

  // Generate a unique filename
  const filename = 'tasks_' + Date.now() + '.json';

  // Create a URL for the blob
  const blobUrl = URL.createObjectURL(blob);

  // Download the file using the chrome.downloads API
  chrome.downloads.download({
    url: blobUrl,
    filename: filename,
    saveAs: true
  }, function (downloadId) {
    // Show a confirmation message
    console.log('Tasks data saved to file:', filename);
  });

}

function _editTask(task) {
  if (task == null) return;

  console.log('popup.js: _editTask(): task = ', task.name);
  if (task.state.includes('running') || task.state.includes('paused')) {
    alert(`Can not edit tasks that are actively running or paused !`);
    return;
  }else {
     _openEditTaskPopup(task);
  }

  // alert(`Can not edit task ["${task.name}"] \n Function is not implemented yet!`);
}

// // Load the task data from local storage when the extension is opened
// document.addEventListener('DOMContentLoaded', loadTaskData);

// Event listener for extension activation
chrome.runtime.onStartup.addListener(loadTaskData);

// Event listener for extension deactivation
chrome.runtime.onSuspend.addListener(saveTaskData);

// ========================================================================
// Function to handle messages received from the edit_task.js script
// ========================================================================
chrome.runtime.onMessage.addListener(function (message) {
  console.log(`popup.js: onPassMessage(#3): ${message.type}`);
  if (message.type === 'updateTask') {
    const updatedTask = message.task;

    // Find the index of the task in the tasks array based on a unique identifier
    const index = myTasks.findIndex(task => task.id === updatedTask.id);

    console.log(`popup.js: onPassMessage(#4): index ${index}: to beupdated`);

    if (index != -1) {
      // Update the task in the tasks array
      myTasks[index] = updatedTask;
      saveTaskData();
      console.log(`popup.js: onPassMessage(#1): Task # ${index}: updated ${updatedTask.name}`);
      console.log(`popup.js: onPassMessage(#1): Task duration ${updatedTask.elapsedTime}`);
    }
    console.log(`popup.js: onPassMessage(#2): failed update for Task # ${index}: ${updatedTask.name}`);
    console.log(`popup.js: onPassMessage(#2): Task duration ${updatedTask.elapsedTime}`);
  }
});


// ===================================================================
// Add neccessary listeners upon completeion of the popup page load
// Code execution starts here...
// ===================================================================
document.addEventListener('DOMContentLoaded', function() {
    eBtnSearch       = document.getElementById('btnSearch');
    eBtnClear        = document.getElementById('btnClear');
    eBtnSave         = document.getElementById('btnSave');
    eBtnLoad         = document.getElementById('btnLoad');

    eBtnTimerStart   = document.getElementById('btnTimerStart');
    eBtnTimerPause   = document.getElementById('btnTimerPause');
    eBtnTimerResume  = document.getElementById('btnTimerResume');
    eBtnTimerEnd     = document.getElementById('btnTimerEnd');
    eBtnEdit         = document.getElementById('btnTaskEdit');

    tableBody        = document.getElementById('tblSearchResults');
    divSearchResults = document.getElementById('div_SearchResults');
    searchInput      = document.getElementById('searchString');

    divSearchSummary = document.getElementById('div_SearchSummary');
    divSearchResults = document.getElementById('div_SearchResults');

    taskNameInput    = document.getElementById('task-name-input');
    timerElement     = document.getElementById('timer');

    taskList        = document.getElementById('task-list');

    chrome.runtime.connect({ name: "popup" });

    // _PopupInitialize();
    loadTaskData();

    eBtnClear &&
    eBtnClear.addEventListener('click', function() {
      ClearAll();
    });

    var radios = document.querySelectorAll('input[type=radio][name="Search_Option"]');
    radios.forEach(radio => radio.addEventListener('change', () => _SelectSearchMode(radio.value)  ));
    // alert(radio.value)

    var radios = document.querySelectorAll('input[type=radio][name="URLvsTITLE"]');
    radios.forEach(radio => radio.addEventListener('change', () => _SelectLinkDisplayhMode(radio.value)  ));

    // =================================================================
    // Process "Save" button click
    // =================================================================
    eBtnSave &&
    eBtnSave.addEventListener('click', function() {
        _Save();
    });

    // =================================================================
    // Add Event Listeners to "Search" button
    // =================================================================
    searchInput.addEventListener('keydown', function(event) { // originally 'keyup'
      if ((event.code === "Enter") || (event.code === "NumpadEnter")) {
        // if (event.keyCode === 13) { // Deprecated property: "keyCode" replaced
        _PerformSearch(searchInput.value);
      }
    });

    eBtnSearch.addEventListener('click', function() {
        _PerformSearch(searchInput.value);
    });

    eBtnTimerStart &&
    eBtnTimerStart.addEventListener('click', function() {
      startTimer();
      console.log("Timer started");
    });

    eBtnTimerPause &&
    eBtnTimerPause.addEventListener('click', function() {
      pauseTimer();
      console.log("Timer paused");
    });

    eBtnTimerResume &&
    eBtnTimerResume.addEventListener('click', function() {
      resumeTimer();
      console.log("Timer resumed");
    });

    eBtnTimerEnd &&
    eBtnTimerEnd.addEventListener('click', function() {
      stopTimer();
      console.log("Timer stopped");
    });

    eBtnEdit &&
    eBtnEdit.addEventListener('click', function() {
      _editTask(activeTask);
      console.log("popup.js: dBtnEdit.Event.Clicked: Starting task edit session");
    });

    // Start the timer when the task name is entered
    taskNameInput&
    // taskNameInput.addEventListener('change', function () { // this was too trigger happy for task name input
    taskNameInput.addEventListener('keydown', function(event) { // originally 'keyup'
      if ((event.code === "Enter") || (event.code === "NumpadEnter")) {
          //taskNameInput.addEventListener('input', function () {
          console.log("Task name entered");
          if (taskNameInput.value.trim() !== '') {
            startTimer();
          } else {
            // stopTimer();
          }
      }
    });

    _PopupInitialize();
});// end of document.addEventListener('DOMContentLoaded', function() {});

// ===================================================================
// Add neccessary listeners to newly opened browser tab events
// ===================================================================
chrome.tabs.onCreated.addListener(function(tab) {
  var startTime = Date.now(); // new Date().getTime();

  // Store the start time in the tab's data object
  // Line 243: chrome.tabs.update(tab.id, { data: { startTime: startTime } });
  //  REFERENCE: https://developer.chrome.com/docs/extensions/reference/tabs/

  _UpdatePluginIcon();
  console.log("New tab opened on: " + formatDate(startTime)) ;//tab.id );
});

// ========================================================================
// Function to update the timer display
// ========================================================================
function updateTimer() {
  const currentTime = Date.now();
  const elapsedTime = currentTime - gStartTime;

  const hours   = Math.floor(elapsedTime / 3600000);
  const minutes = Math.floor((elapsedTime % 3600000) / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);

  const hh = formatTimeComponent(hours);
  const mm = formatTimeComponent(minutes);
  const ss = formatTimeComponent(seconds);

  timerElement.textContent = `${hh}:${mm}:${ss}`;
}

// ========================================================================
// Function to format time component with leading zero if needed
// ========================================================================
function formatTimeComponent(time) {
  return time.toString().padStart(2, '0');
}

// ========================================================================
// Function to format elapsed time in HH:MM:SS format
// ========================================================================
function formatElapsedTime(elapsedTime) {
  const seconds = Math.floor(elapsedTime / 1000) % 60;
  const minutes = Math.floor(elapsedTime / 60000) % 60;
  const hours   = Math.floor(elapsedTime / 3600000);

  return `${formatTimeComponent(hours)}:${formatTimeComponent(minutes)}:${formatTimeComponent(seconds)}`;
}

// ========================================================================
// Function to start the timer
// ========================================================================
function startTimer() {
  if (taskNameInput.value.trim() !== '') {
    // Create a new task data object
    const newTask = {
      id:                  Date.now(),
      parent_id:           null,
      agent_id:            'e1056418',
      name:                taskNameInput.value.trim(),
      state:               '1_running',   // ' 2_paused, 3_planned, 5_mEdited, 6_inEdit,  8_stopped, 9_completed, , 7_scheduled '
      filter_mask:         0, // 0xffff.ffff - mind 64 vs 32-bit integers
      started:             Date.now(),    // TODO: change to startedDate
      startTime:           Date.now(),    // TODO: Change to TimerStartTime
      endTime:             Date.now(),    // TOFO: Change to TimerStopTime
      TotalTimeSpent:      0,             // NB: used to be elapsedTime
      resumeCount:         0,
      plannedDeadline:     null,          // Change: renoved plannedCompleteBy as it is redundant
      plannedStartTime:    null,
      plannedTotalTime:    null,
      estimatedCompletion: null,
      tags:                null,
      shortNote:           null
    };

    // Add the new task to the array
    myTasks.push(newTask);

    // Set it as the active task
    activeTask = newTask;
    // disabled // taskNameInput.value = '';
    eBtnTimerStart.disabled  = eBtnTimerResume.disabled = true;
    eBtnTimerPause.disabled  = eBtnTimerEnd.disabled    = false;

    saveTaskData();
    // Start the timer interval
    gTimerInterval = setInterval(updateTimer, 1000);
  }else{
    alert("Can not start empty task !");
  }
  renderTaskList();
}

// ========================================================================
// Function to pause the timer
// ========================================================================
function pauseTimer() {
  if (activeTask) {
    // Clear the timer interval
    clearInterval(gTimerInterval);
    // activeTask.resumeCount  += 1;
    activeTask.endTime       = Date.now();
    activeTask.state         = '2_paused';
    activeTask.TotalTimeSpent  += activeTask.endTime - activeTask.startTime;
    // Update UI
    eBtnTimerStart.disabled  = true;
    eBtnTimerPause.disabled  = true;
    eBtnTimerResume.disabled = false;
    eBtnTimerEnd.disabled    = false;
  }
  renderTaskList();
  saveTaskData();
}

// ========================================================================
// Function to resume the timer
// ========================================================================
function resumeTimer() {

  if  ( activeTask.state.includes('paused') ||
        activeTask.state.includes('stopped') ||
        activeTask.state.includes('Edit') ) {
    // Calculate pause duration
    // const pauseDuration = Date.now() - activeTask.endTime;

    activeTask.resumeCount  += 1;
    activeTask.startTime     = Date.now();
    activeTask.state         = '1_running';
    taskNameInput.value      = activeTask.name;

    updateTimer();

    // Start the timer interval
    gTimerInterval           = setInterval(updateTimer, 1000);

    // Update UI
    eBtnTimerStart.disabled  = true;
    eBtnTimerResume.disabled = true;
    eBtnTimerPause.disabled  = false;
    eBtnTimerEnd.disabled    = false;

    saveTaskData();
  }

  if (activeTask && (activeTask.state.includes('running') )) {
    taskNameInput.value      = activeTask.name;
    gTimerInterval           = setInterval(updateTimer, 1000);

    eBtnTimerStart.disabled  = true;
    eBtnTimerResume.disabled = true;
    eBtnTimerPause.disabled  = false;
    eBtnTimerEnd.disabled    = false;
  }

  renderTaskList();
}

// ========================================================================
// Function to update the timer display
// ========================================================================
function updateTimer() {
  var newElapsedTime = 0;
  if (activeTask) {
    const currentTime = Date.now();

    //taskNameInput.value = activeTask.name;

    if (activeTask.state.includes('running')) { // replaced === with ==
      newElapsedTime = (currentTime - activeTask.startTime);
    }

    // Update UI with the current active task's elapsed time
    const formattedTime = formatElapsedTime(activeTask.TotalTimeSpent + newElapsedTime);
    timerElement.textContent = formattedTime;
  }else{
    timerElement.textContent = '00:00:00';
  }
}

// ========================================================================
// Function to stop the timer
// ========================================================================
function stopTimer() {
  if (activeTask) {
    // Clear the timer interval
    clearInterval(gTimerInterval);
    // taskList.innerHTML = '';
    //taskNameInput.innerHTML = '';
    taskNameInput.value = '';

    //updateTimer();
    // Set the end time and calculate total elapsed time
    if ( activeTask.state.includes('running') ) {
      activeTask.endTime      = Date.now();
      activeTask.state        = '8_stopped';
      activeTask.TotalTimeSpent += activeTask.endTime - activeTask.startTime;
    }
    // Change status of the task to "stopped"
    activeTask.state.includes('paused') && (activeTask.state = '8_stopped');

    // Update UI
    eBtnTimerStart.disabled  = false;
    eBtnTimerPause.disabled  = eBtnTimerResume.disabled = eBtnTimerEnd.disabled =true;
    // Render the task list
    renderTaskList();
    console.log(`Task:${activeTask}`);
    activeTask=null;
    updateTimer();
  }

  // todo: Also call the following 2 functions whenever the myTasks array is updated:
  // for example, after adding a new task or modifying existing myTasks
  sendTasksToBackground();
  saveTaskData();
}

// ========================================================================
// Function to render the task list
// ========================================================================
function renderTaskList( ) {
  var tTime;
  var eTime = '';

  mySortedTasks = _sortTaskList(myTasks);

  // Clear popup display area
  tableBody.innerHTML         = '';
  // divSearchResults.innerHTML  = '';

  // Render each task in the myTasks array
  mySortedTasks.forEach((task) => {

    const taskItem = document.createElement('div');
    var stState = '';


    var start_Of_Day = new Date();
    var end_Of_Day   = new Date();
    start_Of_Day.setUTCHours(8,0,0,0);
    end_Of_Day.setUTCHours(16,0,0,0); /* UTC endof day = 23,59,59,999 */
    let yesterday = new Date(new Date().setDate(new Date().getDate()-1));


    tTime = formatDate(task.startTime); /* .startTime, task.endTime */
    // console.log(task.endTime);
    eTime = formatElapsedTime(task.TotalTimeSpent);

    if (task.state.includes('running')) { taskItem.className = 'task_link_red';  stState = 'R';}
    if (task.state.includes('paused'))  { taskItem.className = 'task_link_blue'; stState = 'P';}
    if (task.state.includes('stopped') ||
        task.state.includes('Edit')) { taskItem.className = 'task_link_black'; stState = 'S';}

    taskItem.setAttribute("id", task.id );
    taskItem.addEventListener('click', function handleClick(event) {
      //_openTaskDetailsPopup(task);
      console.log('Task div element was clicked 🎉🎉🎉', event);
      // if ( confirm(confirmationText)) {
      _selectContinueTask(event.target.id);
    });

    // Select for tasks display only recent and paused tasks

    if ( (task.startTime > yesterday) || task.state.includes('paused') || task.state.includes('running') ) { // start_Of_Day
        taskItem.textContent = `${tTime}: [${eTime}] (${stState}): ${task.name}`;
    }
    //(task.state).padEnd(8,"_")

    // taskList.appendChild(taskItem);
    tableBody.appendChild(taskItem);
  });
}

// ========================================================================
// Sort tasks by state
// ========================================================================
function _sortTaskList(tasks) {
  return tasks.sort(function(a,b) {
    var x = a.state; var y = b.state; //var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}


// ========================================================================
// Function to prepare timer for continued time tracking for a selected task
// ========================================================================
function _selectContinueTask (task_ID) {

    var selectedTask = null;

    // bad choice? : selectedTask = myTasks.find(task_ID == task_ID);
    // bad choice ?: const result = myTasks.find(({ id }) => id === taskID);
    myTasks.forEach((task) => {
      if (task.id == task_ID) {//changed === to == to accomodate changes in id type "string" vs long
          activeTask = selectedTask = task;
          //continue; Uncaught SyntaxError: Illegal continue statement: no surrounding iteration statement
      }
    });

    var infoText = "";//@here

    infoText += `<b>Selected task</b> : [ <mark>"${selectedTask.name}"</mark> ] <br>`;
    infoText += "<table class='stats_black'><tr><td width=48%>";
    //infoText += `Task ID       : ${selectedTask.id} <br>`;
    infoText += `<b>Task Started </b> : ${formatDate(Number(selectedTask.started))} <br>`;
    infoText += `<b>Current State</b> : ${selectedTask.state} <br>`;
    // Workaround for task object schema change 2023-06-02 3:48 pm PST
    if (selectedTask.TotalTimeSpent === undefined) {
      infoText += `<b>Time spent   </b> : ${formatElapsedTime(selectedTask.elapsedTime)} <br>`;
    }else{
      infoText += `<b>Time spent   </b> : ${formatElapsedTime(selectedTask.TotalTimeSpent)} <br>`;
    }
    console.log(`popup.js: _selectContinuedTask(#1): time spent ${selectedTask.TotalTimeSpent}`);
    infoText += "</td><td width=48%>";
    infoText += `<b>Timer started</b> : ${formatDate(selectedTask.startTime)} <br>`;
    if (selectedTask.state.includes('running')) {
      infoText += `<b>Timer stopped</b> : now running... <br>`;
    }else{
      infoText += `<b>Timer stopped</b> : ${formatDate(selectedTask.endTime)} <br>`;
    }
    infoText += `<b>Resume count </b> : ${selectedTask.resumeCount} <br>`;
    infoText += "</td></tr></table>";

    bSupplINFO && (divSearchSummary.innerHTML = (infoText));

    taskNameInput.value = activeTask.name;
    updateTimer(activeTask);
    _setTimerControls(activeTask);
}

function _setTimerControls (task) {
  switch (task.state) {
    case "1_running":
    case "running" :
      eBtnTimerStart.disabled  = eBtnTimerResume.disabled = eBtnEdit.disabled = true;
      eBtnTimerPause.disabled  = eBtnTimerEnd.disabled = false;
      break;
    case "2_paused":
    case "paused":
      eBtnTimerStart.disabled  = eBtnTimerPause.disabled = true;
      eBtnTimerResume.disabled = eBtnTimerEnd.disabled =  eBtnEdit.disabled = false;
      break;
    case "3_planned":
      eBtnTimerStart.disabled  =  eBtnEdit.disabled = false;
      eBtnTimerPause.disabled = eBtnTimerEnd.disabled = eBtnTimerResume.disabled = true;
      break;
    case "8_stopped":
    case "stopped":
    case "6_inEdit":
      eBtnTimerStart.disabled  = eBtnTimerPause.disabled = eBtnTimerEnd.disabled = true;
      eBtnTimerResume.disabled =  eBtnEdit.disabled = false;
      break;
    case "9_completed": // all timer buttons disabled
      eBtnEdit.disabled = false;
      eBtnTimerStart.disabled  = eBtnTimerPause.disabled = true;
      eBtnTimerEnd.disabled = eBtnTimerResume.disabled = true;
      break;
  }
}


// ========================================================================
// Function to open additinoal popup window
// ========================================================================
function _openTaskDetailsPopup(task) {
  //  chrome.browserAction.onClicked.addListener(function() {
    var w = 440;
    var h = 220;
    var left ,top;
    //var left = (screen.width/2)-(w/2);
    //var top = (screen.height/2)-(h/2);

    chrome.windows.create(
      {
      'url': 'task_detail.html',
      'type': 'popup',
      'width': w,
      'height': h,
      //'left': left,      'top': top
      },
      function(window) {}
    );
  // chrome.browserAction.onClicked.addListener(function() {});
}

// ========================================================================
// Function to save the task data to local storage
// ========================================================================
function saveTaskData() {
  // Convert myTasks array to JSON string
  const taskData = JSON.stringify(myTasks);

  // Save the task data to local storage
  localStorage.setItem('savedTasks', taskData);
  console.log(`popup.js: saveTaskData(): Tasks saved to local storage: ${myTasks.length}`);
}

// ========================================================================
// Function to load the task data from local storage
// ========================================================================
function loadTaskData() {
  // Get the task data from local storage
  // const taskData = localStorage.getItem('savedTasks');
  var taskData = localStorage.getItem('savedTasks');

  // Parse the task data from JSON string to an array
  myTasks = JSON.parse(taskData) || [];

  // Render the task list
  // renderTaskList();
  console.log(`popup.js: loadTaskData(): Tasks retrieved from local storage: ${myTasks.length}`); // ${myTasks.join}
}

// ========================================================================
// Function to send the myTasks array to the background script
// ========================================================================
function sendTasksToBackground() { // send tasks data to background via Messaging function
  chrome.runtime.sendMessage({ tasks: myTasks });
  console.log(`Tasks sent to background script`);
}

// ========================================================================
function _openEditTaskPopup(task) {
// ========================================================================
  // Store the task data in local storage
  // task.state = '6_inEdit';
  task.filter_mask = 0xf5;
  // saveTaskData();
  localStorage.setItem('editTask', JSON.stringify(task));
  console.log(`popup.js: _openEdit...() : Task saved to local storage: ${task}`);
  console.log(`popup.js: _openEdit...() : TotalTimeSpent: ${task.TotalTimeSpent}`);
  // Open the edit task popup window
  // TODO: we need to attach  a window event handler that will notify us when edit is complete
  //       then, we can copy content of 'editTask' into myTasks array
  chrome.windows.create({
    url: 'edit_task.html',
    type: 'popup',
    width: 400,
    height: 300,
  });

}



/*
// ====================== ADDENDUM =================
[1] : Structure of a "data" object in Browsing history

      // {
      //    id:             "2512"
      //    lastVisitTime:  1682213645641.652
      //    title:          "Google Images"
      //    typedCount:     0
      //    url:            "https://www.google.com/imghp?hl=en&tab=ri&ogbl"
      //    visitCount:     1
      // }

[2] : Structure of a "tab" object for a Browser's Tab

        favIconUrl: "https://www.cbsnews.com/fly/bundles/cbsnewscore/icons/icon.svg?v=7976be32c7718021a8332cee4eb15ac6"
        id:         842656694
        incognito:  false
        index:      16
        status:     "unloaded"
        title:      "Update: Cash App founder, MobileCoin CPO Bob Lee stabbed to death in San Francisco's Rincon Hill neighborhood - CBS San Francisco"
        url:        "https://www.cbsnews.com/sanfrancisco/news/fatal-stabbing-bob-lee-mobile-coin-san-francisco-main-street-rincon-hill/"
        windowId:   842656676

[5] : Web links not opening from popup window (--> update manifest for permissions)
Not allowed to load local resource: chrome://newtab/
serviceworker.js:117 [...5ca7af4b98465ab821c5a15d75ef1152] fetching navigation request
   https://...
   FetchEvent {isTrusted: true,
                request: Request,
                clientId: '',
                resultingClientId: '2eb27fa1-bec5-4d19-8a42-1ee1774066e0',
                isReload: false, 
                …}
[6]:
    // https://www.freecodecamp.org/news/how-to-convert-a-string-to-a-number-in-javascript/

[7]: // https://stackoverflow.com/questions/15033196/using-javascript-to-check-whether-a-string-contains-japanese-characters-includi

      // var containsJapanese = string.match(/[\u3400-\u9FBF]/);
      // http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
      // 3000 - 303f: Japanese-style punctuation
      // 3040 - 309f: Hiragana
      // 30a0 - 30ff: Katakana
      // ff00 - ff9f: Full-width Roman characters and half-width Katakana
      // 4e00 - 9faf: CJK unified ideographs - Common and uncommon Kanji
      // 3400 - 4dbf: CJK unified ideographs Extension A - Rare Kanji

      // https://stackoverflow.com/questions/15033196/using-javascript-to-check-whether-a-string-contains-japanese-characters-includi
      // Examples:
      // ロボット同士の“代理会話”だけでカップル成立!?「ロボット婚活」のメリットとは？｜FNNプライムオンライン
      // 【受付中】セミナー開催のお知らせ「今更聞けない！認証とエンドポイント領域における最新の脅威情報～CrowdStrikeとBeyond Ident
      // https://mail.google.com/mail/u/0/#inbox/FMfcgzGsmXDZmSZCqDvBSKhrgfGNQtdJ


     // Use charCode function to detect japanese language. For example, (from website http://www.jpf.go.jp/j/index.html)

      var a=$('a[href$="culture/new/index.html"]').text();
        a=a+'K';
      for(i=0;i<3;i++){ //3 as i knew it was length 3. Please use string.length
          console.log(a.charCodeAt(i));
        //Detect the charCode here and use break on match
      }

      //  Output : 19968 35239 75

      // ------------------------------------------
      This link :
      http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml
      has UNICODE in HEX - you have to check for DECIMAL values.
      Use : http://www.binaryhexconverter.com/hex-to-decimal-converter
      user1428716 / Feb 22, 2013 at 22:01

[8]
      // https://html.spec.whatwg.org/multipage/forms.html#attr-label-for

[9]
      // 32 vs 64 bit integers
      // https://www.w3schools.com/js/js_bitwise.asp
      // https://stackoverflow.com/questions/2983206/bitwise-and-in-javascript-with-a-64-bit-integer
      2^3        = 0000000000000000000000000000000000000000000000000000000000001000;
      2^3 + 2^63 = 0010000000000000000000000000000000000000000000000000000000001000;
      compare to:
      JavaScript uses 32 bits signed integers:
      00000000000000000000000000000101 (5)
      11111111111111111111111111111010 (~5 = -6)
      A signed integer uses the leftmost bit as the minus sign.
*/
