// FILE: background.js

let numTabs                 = 0;
let numWindows              = 0;
let TabCountAdjustment      = 0;
let WindowsCountAdjustment  = 0;
let bgTasks                 = [];


function _collectInfo() {

    chrome.windows.getAll({}, function(windows) {  numWindows = windows.length; }); // {populate: true}, function(window) {
    chrome.tabs.query({}, function(tabs) { numTabs = tabs.length;  }); // chrome.tabs.query({windowType:'normal'}, function(tabs)
    console.log(`INFO(_collectInfo): Windows: ${numWindows}, Tabs: ${numTabs}`);
    // console.log(`INFO(_collectInfo): AllTabs: ${AllTabs}`);
}

function _updateBadge() {
    _collectInfo();
    chrome.action.setBadgeText({text: '' + `${numWindows}:${numTabs+TabCountAdjustment}`});
}

//_collectInfo();
_updateBadge();

chrome.tabs.onCreated.addListener(function(tab) {
    if ( numTabs > 0 ) TabCountAdjustment = 1;
    _updateBadge();
    console.log('INFO(tabs.onCreated): New tab opened');
});

chrome.tabs.onRemoved.addListener(function(tab) {
    TabCountAdjustment = -1;
    _updateBadge();
    console.log('INFO(tabs.onRemoved): Tab closed');
});

chrome.windows.onCreated.addListener(function(window) {
    _updateBadge();
    console.log('INFO(windows.onCreated): window created');
});

chrome.windows.onRemoved.addListener(function(window) {
    _updateBadge();
    console.log('INFO(windows.onRemoved): Window closed');
});

// Event listener for receiving messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.tasks) {
      // The tasks array is received from the popup script
      const rcvdTasks = request.tasks;

      // Do whatever you need with the tasks data in background.js
      // ...

      // Example: Logging the tasks array
      console.log(`bgReceived Tasks: ${rcvdTasks}`);
    }
});

// // Event listener for extension activation
chrome.runtime.onStartup.addListener(bgLoadTaskData);
//
// // Event listener for extension deactivation
chrome.runtime.onSuspend.addListener(bgSaveTaskData);

// background.js
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "popup") {
        port.onDisconnect.addListener(function() {
           console.log("bgLog: popup has been closed")
        });
    }
});

// ========================================================================
// Function to save the task data to local storage
// ========================================================================
function bgSaveTaskData() {
    // Convert bgTasks array to JSON string
    const taskData = JSON.stringify(bgTasks);

    // Save the task data to local storage
    localStorage.setItem('bgSavedTasks', taskData);
    console.log(`BG: Task saved to local storage}`);
}

// ========================================================================
// Function to load the task data from local storage
// ========================================================================
function bgLoadTaskData() {
    // Get the task data from local storage
    const taskData = localStorage.getItem('bgSavedTasks');

    // Parse the task data from JSON string to an array
    bgTasks = JSON.parse(taskData) || [];

    // Render the task list
    // renderTaskList(); // in popup.js
    console.log(`BG: Tasks retrieved from local storage: ${bgTasks.length}`); // ${bgTasks.join}
}

// // ========================================================================
// // Function to send the bgTasks array to the background script
// // ========================================================================
// function bgSendTasksToBackground() {
//     chrome.runtime.sendMessage({ tasks: bgTasks });
//     console.log(`Tasks sent to background script`);
// }
