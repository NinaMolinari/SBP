// =================================================================
// FILE:      popup.html
// Copyright: Nina Molinari 2023 (c)
// PROJECT:   Smart Links Browser Plugin
//            I need a way to "keep tabs on my tabs" so to speak... ;-)
//            So, hence, I am building this Tab/Links tracker/search.
// =================================================================

var eBtnShowHist      = document.getElementById('btnShowHist');
var eBtnSaveHist      = document.getElementById('btnSaveHist');
var eBtnTabsInfo      = document.getElementById('btnListTabs');
var eBtnClear         = document.getElementById('btnClear');
var eBtnSearch        = document.getElementById('searchButton');
var tableBody         = document.getElementById('tblSearchResults');
var searchInput       = document.getElementById('searchString');
var divSearchResults  = document.getElementById('div_SearchResults');
var divSearchSummary  = document.getElementById('div_SearchSummary');
var gSearchMode       = "mode_SearchTabs"; // (other optioons: mode_SearchFavs, mode_SearchHist)
var bSupplINFO        = true;

var gTotalOpenWindows = 0;
var gTotalOpenTabs    = 0;
var gMatchedTabs      = 0;

function formatDate (date) {
      nDate         = new Date(date);
      const year    = nDate.getFullYear();
      const month   = (nDate.getMonth() + 1).toString().padStart(2, '0');
      const day     = nDate.getDate().toString().padStart(2, '0');
      const hours   = nDate.getHours().toString().padStart(2, '0');
      const minutes = nDate.getMinutes().toString().padStart(2, '0');
      const seconds = nDate.getSeconds().toString().padStart(2, '0');
      return (`${year}.${month}.${day} ${hours}:${minutes}`);
};

// =================================================================
// Clear Popup window from previously displayed information
//
function ClearAll() {
  tableBody.innerHTML         = '';
  divSearchResults.innerHTML  = '';
  divSearchSummary.innerHTML  = ':';
}

// =================================================================
function _SelectSearchMode(search_mode) {
    (search_mode == "mSearchTabs") && (gSearchMode="mode_SearchTabs");
    (search_mode == "mSearchHist") && (gSearchMode="mode_SearchHist");
    (search_mode == "mSearchFavs") && (gSearchMode="mode_SearchFavs");
  // alert('Search Mode changed to :' + search_mode);
    bSupplINFO == true && (divSearchSummary.innerHTML = (`INFO: Search Mode:<b> ${search_mode} </b>`));
}

// =================================================================
function _PopupInitialize() {
  _CollectTabsInfo();
}

// =================================================================
// Updates Plugin icon with the current count of "Windows:Tabs"
//
function _UpdatePluginIcon() {
  _CollectTabsInfo();
}

// =================================================================
// Collects info on open browser Windows and Tabs and updates
// Plugin Icons with the current count of "Windows:Tabs"
// =================================================================
function _CollectTabsInfo() {
  chrome.windows.getAll({populate: true}, function(windows) {
    win_count         = windows.length;
    gTotalOpenWindows = windows.length;
    total_tabs        = 0;
    active_tabs       = 0;
    tabs_count_string = '( ';

    console.log ("Total Windows: " + windows.length);

    windows.forEach( function(window) {
        total_tabs += window.tabs.length;
        console.log ("Active Tab Count: " + window.tabs.length);

        if (window.focused) {
          tabs_count_string += '<b>'+ window.tabs.length  + '</b> ; ';
          console.log ("Active Tab Count: " + window.tabs.length);
        }
        else {
          tabs_count_string += window.tabs.length + ' ; ';
          console.log ("Inactive Window: " + window.tabs.length);
        }
        window.tabs.forEach(function(_tab) {
          // chrome.runtime.sendMessage({command: "displayUrls", urls: urls});
          // Collect detailed information about each tab here
        });
    }); // =====> end of windows.forEach()

    gTotalOpenTabs = total_tabs;
    tabs_count_string += " )";
    chrome.action.setBadgeText({text: '' + `${win_count}:${total_tabs}`});
    divSearchSummary.innerHTML = (`TABS: ${total_tabs} in ${win_count} Windows:  (${tabs_count_string})<br>`);
  }); // =======> end of chrome.windows.getAll()
}

// =================================================================
function _PerformSearch() {
// =================================================================
    (gSearchMode == "mode_SearchTabs") && _SearchTabs(searchInput.value);
    (gSearchMode == "mode_SearchHist") && _SearchHist(searchInput.value);
    (gSearchMode == "mode_SearchFavs") && _SearchFavs(searchInput.value);
}

// ==================================================
function _SearchTabs(search_pattern) {
// ==================================================
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

      matchingTabs.forEach (function (mTab) {
        tCount +=1 ;
        var tr = document.createElement('tr');
        // console.log( " original: " + tCount ":" +  mTab.title );
        // console.log( ` original: ${tCount} :  ${mTab.title}` );
        cTitle = mTab.title.replace(/</g,"&lt;");
        tr.innerHTML = '<td> (' + tCount + ')</td><td width="400"><a href=' + mTab.url + '>[' + cTitle + ']</a></td>';
        tableBody.appendChild(tr);
      });
      gMatchedTabs = matchingTabs.length;
      divSearchSummary.innerHTML = (`INFO: ${gMatchedTabs} tabs matched out of ${tabs.length}`);
  });
}

// ==================================================
function _SearchHist(search_pattern) {
// ==================================================
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
      var displayTitle    = '';

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

              displayTitle = ((page.title != '')? page.title:page.url).substring(0,78) ;

              //tr.innerHTML = '<td width=10%>' + current_count + '</td><td width=30%>' + time + '</td><td=40%><a href='+page.url+'>'+ page.title + '</a></td>';
              tr.innerHTML = '<td width=6%>' + current_count + '</td><td width=18%>' + time + '</td><td><a href='+page.url+'>'+ displayTitle + '</a></td>';

              tableBody.appendChild(tr);
          }
      });

      divSearchSummary.innerHTML = (`INFO: Total found: ${matchedPages.length} out of ${visited_pages.length} URLs visits in browsing history`);
      console.log("Total Matched Hist Pages: " + matchedPages.length);
  });
} // end of function _SearchHist()

// ===================================================================
// Add neccessary listeners upon completeion of the popup page load
// ===================================================================
document.addEventListener('DOMContentLoaded', function() {
    eBtnShowHist     = document.getElementById('btnShowHist');
    eBtnSaveHist     = document.getElementById('btnSaveHist');
    eBtnTabsInfo     = document.getElementById('btnListTabs');
    eBtnClear        = document.getElementById('btnClear');
    tableBody        = document.getElementById('tblSearchResults');
    divSearchResults = document.getElementById('div_SearchResults');
    searchInput      = document.getElementById('searchString');
    eBtnSearch       = document.getElementById('searchButton');
    divSearchSummary = document.getElementById('div_SearchSummary');
    divSearchResults = document.getElementById('div_SearchResults');

    eBtnClear &&
    eBtnClear.addEventListener('click', function() {
      ClearAll();
    });

    var radios = document.querySelectorAll('input[type=radio][name="Search_Option"]');
    radios.forEach(radio => radio.addEventListener('change', () => _SelectSearchMode(radio.value)  ));
    // alert(radio.value)

    // =================================================================
    // Process "Save" button click
    // =================================================================
    eBtnSaveHist &&
    eBtnSaveHist.addEventListener('click', function() {
      chrome.history.search({text: '', startTime: 0, maxResults: 0}, function(data) {
         // console.log(`data: ${data}` );
        data.forEach(function(page) {
          page.lastVisitTime = new Date(page.lastVisitTime).toLocaleString('en-US', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });
          // console.log(page);
        });

        var jsonData = JSON.stringify(data);
        var blob = new Blob([jsonData], {type: 'application/json'});
        var url = URL.createObjectURL(blob);

        // Open "Save as" dialog window
        chrome.downloads.download({ url: url, filename: 'Browsing_history.json', saveAs: true});
      });
    });

    // =================================================================
    // Add Event Listeners to "Search" button
    // =================================================================
    searchInput.addEventListener('keydown', function(event) { // originally 'keyup'
      if ((event.code === "Enter") || (event.code === "NumpadEnter")) {
        // if (event.keyCode === 13) { // Deprecated property: "keyCode" replaced
        // _SearchTabs(searchInput.value);
        _PerformSearch(searchInput.value);
      }
    });

    eBtnSearch.addEventListener('click', function() {
        // _SearchTabs(searchInput.value);
        _PerformSearch(searchInput.value);
    });

    _PopupInitialize();
});


chrome.tabs.onCreated.addListener(function(tab) {
  var startTime = Date.now(); // new Date().getTime();

  // Store the start time in the tab's data object
  // Line 243: chrome.tabs.update(tab.id, { data: { startTime: startTime } });
  /*
    ERROR:
    Error in event handler: TypeError: Error in invocation of tabs.update(optional integer tabId,
    object updateProperties, optional function callback):
    Error at parameter 'updateProperties': Unexpected property: 'data'.
    at chrome-extension://pikbbjcfacedhhkhgajpnbblgmgbnhfo/popup.js:243:15
    >
    REFERENCE: https://developer.chrome.com/docs/extensions/reference/tabs/
  */
  console.log("New tab opened on: " + formatDate(startTime)) ;//tab.id );
  //
  // Error in event handler: TypeError: Cannot read properties of undefined (reading 'startTime')
  // at chrome-extension://pikbbjcfacedhhkhgajpnbblgmgbnhfo/popup.js:256:48
  //
});

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
