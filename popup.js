/*
// =================================================================
// FILE:        popup.html
// DATE:        2023-05-21 11:05 am PDT
// Copyright:   Nina Molinari 2023 (c)
//
// PROJECT:     "Keeping Tabs" Browser Plugin
//              (originally named "Smart Links")
//              I need a way to "keep tabs" on my tasks and work time spent in browser.
//              So, hence, I am building this Tasks/Taba/Links tracker.
//
// VERSION:     00.01.12
//
// IMPLEMENTED:
//              - Initial stab for working with tasks and timers
//
// TODO:
//              - add option to save open tabs
//              - finish running timer resumption on extension popup.
//              - select task for continuation
//              - select task for changing status to "completed"
//              - implemet "change status of task to completed"
//              - Search in tasks
//              - Save / Load tasks
//              - Save / Load tabs
//              - Save / Load favorites
//              - Load file with custom browsing history
//              - ...
//              - data storage for subscribers
// =================================================================
*/
// DOM elements

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

var taskList          = document.getElementById('task-list');

// Search block
var tableBody         = document.getElementById('tblSearchResults');
var searchInput       = document.getElementById('searchString');
var divSearchResults  = document.getElementById('div_SearchResults');
var divSearchSummary  = document.getElementById('div_SearchSummary');

// Local vars

let myTasks           = [];     // Array to store task data objects
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

// ========================================================================
function formatDate (date) {
  // ========================================================================
  console.log(`formatDate:${date}`);

      nDate         = new Date(date);
      const year    = nDate.getFullYear();
      const month   = (nDate.getMonth() + 1).toString().padStart(2, '0');
      const day     = nDate.getDate().toString().padStart(2, '0');
      const hours   = nDate.getHours().toString().padStart(2, '0');
      const minutes = nDate.getMinutes().toString().padStart(2, '0');
      const seconds = nDate.getSeconds().toString().padStart(2, '0');
      return (`${year}.${month}.${day} ${hours}:${minutes}`);
};

// ========================================================================
// Clear Popup window from previously displayed information
// ========================================================================
function ClearAll() {
  tableBody.innerHTML         = '';
  divSearchResults.innerHTML  = '';
  divSearchSummary.innerHTML  = ':';
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

  _UpdatePluginIcon();

  myTasks.forEach((task) => {
      if (task.state === 'running') {
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

    console.log ("Total Windows: " + windows.length);

    windows.forEach( function(window) {
        total_tabs += window.tabs.length;

        if (window.focused) {
          tabs_count_string += '<b>'+ window.tabs.length  + '</b> ; ';
          console.log ("Tabs in Focused Window: " + window.tabs.length);
        }
        else {
          tabs_count_string += window.tabs.length + ' ; ';
          console.log ("Tabs in UnFocused Window: " + window.tabs.length);
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
    divSearchSummary.innerHTML = (`TABS: ${gTotalOpenTabs} in ${gTotalOpenWindows} Windows:  (${gTabsCountString})<br>`);
  }); // =======> end of chrome.windows.getAll()
}

// ========================================================================
function _PerformSearch() {
// ========================================================================
    (gSearchMode == "mode_SearchTabs")  && _SearchTabs(searchInput.value);
    (gSearchMode == "mode_SearchHist")  && _SearchHist(searchInput.value);
    (gSearchMode == "mode_SearchFavs")  && _SearchFavs(searchInput.value);
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
          //var pUrl    = page.url;
          //var pTitle  = page.title; // .substring(0, 80);
          current_count += 1;

          if ((page.url.indexOf(search_pattern) !== -1) || (page.title.indexOf(search_pattern) !== -1)) {
              matchedPageURLs.push(page.url);
              matchedPageTitles.push(page.title);
              matchedPages.push({Url:page.url, Title: page.title});

              linkText = ((page.title != '')? page.title:page.url).substring(0,78) ;

              //tr.innerHTML = '<td width=10%>' + current_count + '</td><td width=30%>' + time + '</td><td=40%><a href='+page.url+'>'+ page.title + '</a></td>';
              tr.innerHTML = '<td width=6%>' + current_count + '</td><td width=18%>' + time + '</td><td><a href='+page.url+'>'+ linkText + '</a></td>';

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


// // Load the task data from local storage when the extension is opened
// document.addEventListener('DOMContentLoaded', loadTaskData);

// Event listener for extension activation
chrome.runtime.onStartup.addListener(loadTaskData);
// Event listener for extension deactivation
chrome.runtime.onSuspend.addListener(saveTaskData);

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

    // Start the timer when the task name is entered
    taskNameInput&
    taskNameInput.addEventListener('change', function () {
      //taskNameInput.addEventListener('input', function () {
      console.log("Task name entered");
      if (taskNameInput.value.trim() !== '') {
        startTimer();
      } else {
        stopTimer();
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
  const hours = Math.floor(elapsedTime / 3600000);

  return `${formatTimeComponent(hours)}:${formatTimeComponent(minutes)}:${formatTimeComponent(seconds)}`;
}

// ========================================================================
// Function to start the timer
// ========================================================================
function startTimer() {
  if (taskNameInput.value.trim() !== '') {
    // Create a new task data object
    const newTask = {
      id:           (Date.now()).toFixed(),
      name:         taskNameInput.value.trim(),
      startTime:    Date.now(),
      endTime:      Date.now(),
      elapsedTime:  0,
      state:        'running' // 'stopped, paused, completed'
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
  }
}

// ========================================================================
// Function to pause the timer
// ========================================================================
function pauseTimer() {
  if (activeTask) {
    // Clear the timer interval
    clearInterval(gTimerInterval);
    activeTask.endTime = Date.now();
    activeTask.state =  'paused';
    activeTask.elapsedTime += activeTask.endTime - activeTask.startTime;
    // Update UI
    eBtnTimerStart.disabled  = true;
    eBtnTimerPause.disabled  = true;
    eBtnTimerResume.disabled = false;
    eBtnTimerEnd.disabled    = false;
  }
  saveTaskData();
}

// ========================================================================
// Function to resume the timer
// ========================================================================
function resumeTimer() {

  if (activeTask && ((activeTask.state == 'paused') || (activeTask.state == 'stopped')) ) {
    // Calculate pause duration
    // const pauseDuration = Date.now() - activeTask.endTime;

    activeTask.startTime = Date.now();
    activeTask.state = 'running';
    taskNameInput.value = activeTask.name;

    updateTimer();

    // Start the timer interval
    gTimerInterval = setInterval(updateTimer, 1000);

    // Update UI
    eBtnTimerStart.disabled  = true;
    eBtnTimerResume.disabled = true;
    eBtnTimerPause.disabled  = false;
    eBtnTimerEnd.disabled    = false;

    saveTaskData();
  }

  if (activeTask && (activeTask.state == 'running') ) {
    taskNameInput.value = activeTask.name;
    gTimerInterval = setInterval(updateTimer, 1000);

    eBtnTimerStart.disabled  = true;
    eBtnTimerResume.disabled = true;
    eBtnTimerPause.disabled  = false;
    eBtnTimerEnd.disabled    = false;
  }
}

// ========================================================================
// Function to update the timer display
// ========================================================================
function updateTimer() {
  var newElapsedTime = 0;
  if (activeTask) {
    const currentTime = Date.now();

    //taskNameInput.value = activeTask.name;

    if (activeTask.state === 'running') {
      newElapsedTime = (currentTime - activeTask.startTime);
    }

    // Update UI with the current active task's elapsed time
    const formattedTime = formatElapsedTime(activeTask.elapsedTime + newElapsedTime);
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
    if (activeTask.state == 'running') {
      activeTask.endTime = Date.now();
      activeTask.state = 'stopped';
      activeTask.elapsedTime += activeTask.endTime - activeTask.startTime;
    }
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
function renderTaskList() {
  var tTime;
  var eTime = '';

  // Clear popup display area
  tableBody.innerHTML         = '';
  // divSearchResults.innerHTML  = '';

  // Render each task in the myTasks array
  myTasks.forEach((task) => {

    const taskItem = document.createElement('div');

    tTime = formatDate(task.endTime); // .startTime
    console.log(task.endTime);
    eTime = formatElapsedTime(task.elapsedTime);

    // Style the taskItem div element via css properties using class name
    taskItem.className = 'task_link';
    taskItem.setAttribute("id", task.id );
    taskItem.addEventListener('click', function handleClick(event) {
      //_openTaskDetailsPopup(task);
      console.log('Task div element was clicked 🎉🎉🎉', event);
      // if ( confirm(confirmationText)) {
      _selectContinueTask(event.target.id);
    });

    taskItem.textContent = `${tTime}: [${eTime}] : (${(task.state).padEnd(8,"_")}) : ${task.name}`;

    // taskList.appendChild(taskItem);
    tableBody.appendChild(taskItem);
  });
}


// ========================================================================
// Function to prepare timer for continued time tracking for a selected task
// ========================================================================
function _selectContinueTask (task_ID) {

    var selectedTask = null;

    // bad: // selectedTask = myTasks.find(task_ID == task_ID);
    // const result = inventory.find(({ name }) => name === "cherries");
    myTasks.forEach((task) => {
      if (task.id === task_ID) {
          activeTask = selectedTask = task;
          //continue; Uncaught SyntaxError: Illegal continue statement: no surrounding iteration statement
      }
    });

    var infoText = "";
    infoText += `selectedTask: ${selectedTask.name} <br>`;
    infoText += `time spent so far: ${selectedTask.elapsedTime} ms`;
    bSupplINFO && (divSearchSummary.innerHTML = (infoText));


    taskNameInput.value = activeTask.name;
    updateTimer(activeTask);
    _setTimerControls(activeTask);
}

function _setTimerControls (task) {
  // if task.state === 'running' || task.state === '
  switch (task.state) {
    case "running":
      eBtnTimerStart.disabled  = eBtnTimerResume.disabled = true;
      eBtnTimerPause.disabled  = eBtnTimerEnd.disabled = false;
      break;
    case "paused":
      eBtnTimerStart.disabled  = eBtnTimerPause.disabled = true;
      eBtnTimerResume.disabled = eBtnTimerEnd.disabled = false;
      break;
    case "stopped":
    case "planned":
      eBtnTimerStart.disabled  = eBtnTimerPause.disabled = eBtnTimerEnd.disabled = true;
      eBtnTimerResume.disabled = false;
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
  console.log(`Tasks Data saved to local storage}`);
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
  console.log(`Tasks retrieved from local storage: ${myTasks.length}`); // ${myTasks.join}
}

// ========================================================================
// Function to send the myTasks array to the background script
// ========================================================================
function sendTasksToBackground() { // send tasks data to background via Messaging function
  chrome.runtime.sendMessage({ tasks: myTasks });
  console.log(`Tasks sent to background script`);
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

*/
