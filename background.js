// FILE: background.js

let numTabs                 = 0;
let numWindows              = 0;
let TabCountAdjustment      = 0;
let WindowsCountAdjustment  = 0;



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

