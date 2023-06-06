// =================================================================
// FILE: background.js
// =================================================================
// TODO: read Cross-Extension messaging:
//       https://developer.chrome.com/docs/extensions/mv3/messaging/#connect
//

let gNumTabs                 = 0;
let gNumWindows              = 0;
let TabCountAdjustment       = 0;
let WindowsCountAdjustment   = 0;
let bgTasks                  = [];


function _collectInfo(callback) {

    // chrome.windows.getAll({}, function(windows) {  gNumWindows = windows.length; }); // {populate: true}, function(window) {
    // var myPromise =

    // Trying to deal with a promise...
    chrome.windows.getAll({populate: true}, function(windows_list) {
        var tabs_list = [];
        gNumWindows = windows_list.length;
        for (var i = 0; i < gNumWindows; i++) {
            tabs_list.concat(windows_list[i].tabs); // push(windows_list[i]);
        }

        console.log(`background.js: _collectInfo(#1)` + tabs_list);
        if (callback) {
            callback(tabs_list);
            console.log(`background.js: _collectInfo(#2): ${tabs_list}`); //    ${tabs_list.join(', ')}
        }
    });

    // myPromise.then(function(data) {
    //     console.log(`OnPromise: Windows: ${data}`);
    // } );// {populate: true}, function(window) {

    chrome.tabs.query({}, function(tabs) { gNumTabs = tabs.length;  }); // chrome.tabs.query({windowType:'normal'}, function(tabs)
    // console.log(`INFO(_collectInfo): Windows: ${gNumWindows}, Tabs: ${gNumTabs}`);
}

function _updateBadge() {
    var  mytabs_list = [];
    _collectInfo( function(mytabs_list) {
        console.log(`background.js: _updateBadge(#1): ${mytabs_list.length}`);
    });
    if (gNumWindows && gNumTabs) {
        chrome.action.setBadgeText({text: '' + `${gNumWindows}:${gNumTabs+TabCountAdjustment}`});
    }
    console.log(`background.js: _updateBadge(#2): W:${gNumWindows},T:${gNumTabs+TabCountAdjustment}`);
}

//_collectInfo();
_updateBadge();

chrome.tabs.onCreated.addListener(function(tab) {
    // if ( gNumTabs > 0 ) TabCountAdjustment = 0;
    console.log(`background.js:gNumTabs: ${gNumTabs}`);
    gNumTabs +=1; // adding to tabs count ahead of promise
    _updateBadge();
    console.log(`background.js:gNumTabs: ${gNumTabs}`);
    console.log('INFO(tabs.onCreated): New tab opened');
});

chrome.tabs.onRemoved.addListener(function(tab) {
    //TabCountAdjustment = -1;
    gNumTabs -=1; // subtracting from tabs count ahead of promise
    _updateBadge();
    console.log('INFO(tabs.onRemoved): Tab closed');
});

chrome.windows.onCreated.addListener(function(window) {
    console.log(`background.js: windows.onCreated(#1): gNumWindows = ${gNumWindows}`);
    if (gNumWindows > 1) {
        gNumWindows += 1; // adding to windows count ahead of promise
    }
    _updateBadge();
    console.log(`background.js: windows.onCreated(#2): gNumWindows = ${gNumWindows}`);
});

chrome.windows.onRemoved.addListener(function(window) {
    gNumWindows -= 1; // subtracting from windows count ahead of promise
    _updateBadge();
    console.log('background.js: windows.onRemoved(): Window closed:'+ window.document );
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
           console.log(`background.js: port.onDisconnect(): Popup was closed: ${new Date().toString()}`);
        });
    }
});


chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'logMessage') {
      console.log(message.message);
    }
});

// ========================================================================
// Save the tasks data to local storage
// ========================================================================
function bgSaveTaskData() {
    // Convert bgTasks array to JSON string
    const taskData = JSON.stringify(bgTasks);

    // Save the task data to local storage
    localStorage.setItem('bgSavedTasks', taskData);
    console.log(`background.js: bgSaveTaskData(): Tasks saved to local storage: ${taskData.length}`);
}

// ========================================================================
// Load the tasks data from local storage
// ========================================================================
function bgLoadTaskData() {
    // Get the task data from local storage
    // const taskData = localStorage.getItem('bgSavedTasks');

    // Error in event handler: ReferenceError: localStorage is not defined
    // localStorage && localStorage.removeItem('bgSavedTasks');

    const taskData = [];

    if ( (typeof(localStorage) !== "undefined") && (localStorage.length) ) {
        (taskData = localStorage.getItem('bgSavedTasks'));
    }
    //
    // Parse the task data from JSON string to an array
    bgTasks = JSON.parse(taskData) || [];

    // Render the task list
    // renderTaskList(); // in popup.js
    console.log(`background.js: bgLoadTaskData(): Tasks retrieved from local storage: ${bgTasks.length}`); // ${bgTasks.join}
}



// // ========================================================================
// // Function to send the bgTasks array to the background script
// // ========================================================================
// function bgSendTasksToBackground() {
//     chrome.runtime.sendMessage({ tasks: bgTasks });
//     console.log(`Tasks sent to background script`);
// }
