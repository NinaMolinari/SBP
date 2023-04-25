// =================================================================
// FILE:      popup.js
// Copyright: Nina Molinari 2023 (c)
//
// PROJECT:   Smart Browser Plugin
//            This is my small attempt to keep the "tabs" on the 
//            time I spend working on differenct projects.
//            There are a few good plugins out there that manage 
//            browsing chaos -- I just need something that works for me...            
// =================================================================

function fmtDate (date) {
      const year    = date.getFullYear();
      const month   = (date.getMonth() + 1).toString().padStart(2, '0');
      const day     = date.getDate().toString().padStart(2, '0');
      const hours   = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return (`${year}.${month}.${day} ${hours}:${minutes}`);
};

document.addEventListener('DOMContentLoaded', function() {
  //
    var eBtnShowHist     = document.getElementById('btnShowHist');
    var eBtnSaveHist     = document.getElementById('btnSaveHist');
    var eBtnTabsInfo     = document.getElementById('btnListTabs');
    var eBtnClear        = document.getElementById('btnClear');    
    var tableBody        = document.getElementById('historyTable');     
    var statsDiv         = document.getElementById('tabsInfo');
    var searchInput      = document.getElementById('searchString');
    var elSearchButton   = document.getElementById('searchButton');    
    var bInitSearch      = true;
    var _web_history     = [];

    // elSearchButton.innerHTML = 'Search Tabs';
    // =================================================================    
    // Process "ClearAll" button click
    // =================================================================
    function ClearAll() {
      tableBody.innerHTML = '';
      statsDiv.innerHTML  = '';      
    }
    eBtnClear &&
    eBtnClear.addEventListener('click', function() { 
      ClearAll();
    });

    // =================================================================    
    // Process "ShowHist" button click
    // =================================================================
    eBtnShowHist &&
    eBtnShowHist.addEventListener('click', function() { 
      if (0) { // this block is disabled and soon to be deleted
          chrome.history.search({text: '', maxResults: 0}, function(data) {
            var history = [];
            for (var i = 0; i < data.length; i++) {
                var date  = new Date(data[i].lastVisitTime);
                var url   = data[i].url;
                history.push({date: date, url: url});
            }
            var json = JSON.stringify(history);
            console.log(json);
          });
      }

      if (1) {
          chrome.history.search( {text: '', maxResults: 0}, function(data) {            
            tableBody.innerHTML = '';
            var total_count = data.length;
            var current_count = 0;
            data.forEach(function(page) {
              // console.log(page);
              var tr = document.createElement('tr');
              var date = new Date(page.lastVisitTime);
              var time = date.toLocaleString();
              var time = fmtDate(date);// time.substring(
              var url = (page.url).substring(0, 80);
              current_count += 1;
              tr.innerHTML = '<td>' + current_count + '</td><td>' + time + '</td><td>' + url + '</td>';          
              tableBody.appendChild(tr);
            });
          });
      }
    }); // end of eBtnShowHist.addEventListener()

    // =================================================================    
    // Process "Save" button click
    // =================================================================
    eBtnSaveHist && 
    eBtnSaveHist.addEventListener('click', function() {
      chrome.history.search({text: '', maxResults: 0}, function(data) {
         // console.log(`data: ${data}` );
        data.forEach(function(page) {       
          page.lastVisitTime = new Date(page.lastVisitTime).toLocaleString('en-US', { hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' });
          // console.log(page);
        });

        var jsonData = JSON.stringify(data);
        var blob = new Blob([jsonData], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
  
        chrome.downloads.download({
          url: url,
          filename: 'history.json',
          saveAs: true
        });
      });
    });
    // =================================================================
    // Process "Tabs_info" button click
    // =================================================================    
    eBtnTabsInfo !== null &&
    eBtnTabsInfo.addEventListener('click', function() {
        // Collect info on all open windows and tabs
        //  
        chrome.windows.getAll({populate: true}, function(windows) {
          win_count = windows.length;
          total_tabs = 0;
          active_tabs = 0;
          tabs_count_string = '(';
          //console.log ("Windows Count: " + win_count);
          windows.forEach(function(window) {
            total_tabs += window.tabs.length;
            
            if (window.focused) {
              active_tabs = window.tabs.length;
              console.log ("Active Tab Count: " + active_tabs);
            }
            else {
              tabs_count_string += window.tabs.length + ' + ';
              //console.log ("Inactive Tab Count: " + total_tabs);// windows.length);
              console.log ("Inactive Window: " + window.tabs.length); // windows.length);            
            }
            window.tabs.forEach(function(_tab) {
              // chrome.runtime.sendMessage({command: "displayUrls", urls: urls});
              // Collect information about each tab here
            });
          }); // =====> end of windows.forEach()
          tabs_count_string += ")";
          chrome.action.setBadgeText({text: '' + `${win_count}:${total_tabs}`});
        }); // =======> end of chrome.windows.getAll()

        // =================================================================
        chrome.tabs.query({}, function(tabs) {
          var tabUrls   = [];
          var tabTitles = [];
          var foundTabs = [];
          var allTabs   = tabs;
          for (var i = 0; i < tabs.length; i++) {
            // foundTabs.push(tabs[i]);
            tabUrls.push(tabs[i].url);
            tabTitles.push(tabs[i].title);
          }
          // console.log(tabUrls);

          // var statsDiv = document.createElement('div');
          // document.body.appendChild(statsDiv);
          // "tabsInfo"

          statsDiv.innerHTML = (`Windows: ${win_count} // Tabs: ${total_tabs}:${tabs_count_string} <br>`); 

          // var searchInput = document.createElement('input');
          // searchInput.type = 'text';
          // document.body.appendChild(searchInput);
        
          if (0) { // now created in popup.html
              var searchButton = document.createElement('button');
              searchButton.innerHTML = 'Search Tabs';
              document.body.appendChild(searchButton);
          }
          var resultsDiv = document.createElement('div');
          document.body.appendChild(resultsDiv);

          // =================================================================
          // Search within open tabs
          // ================================================================= 
          function performSearch() {
            var searchText    = searchInput.value;
            var matchingUrls  = [];
            var matchingTabs  = [];        
            foundTabs         = [];

            ClearAll();
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
            // console.log(matchingUrls);

            // Block removed: see [3]
            // See [2], for details on fTab elements and properties

            //@here : SUN 4/23 13:08
            if (1) {
              // originally: resultsDiv.innerHTML = matchingUrls.join('<br>');
                 tCount = 0;
                 // var cTile = "";
                 matchingTabs.forEach (function (mTab) {
                    tCount +=1 ;
                    var tr = document.createElement('tr');
                    // console.log( " original: " + tCount ":" +  mTab.title );
                    // console.log( ` original: ${tCount} :  ${mTab.title}` );                    
                    cTitle = mTab.title.replace(/</g,"&lt;");
                    //string = string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    // console.log( ` replaced: ${tCount} :  ${cTitle}` );
                    // string.replace(/="[^"]+"/g,function($0){return $0.replace(/&lt;/g,"<").replace(/&gt;/g,">");})
                    tr.innerHTML = '<td> (' + tCount + ')</td><td width="600"><a href=' + mTab.url + '>[' + cTitle + ']</a></td>';
                    //resultsDiv.appendChild(tr);
                    statsDiv.appendChild(tr);
                 });
            }
          } // end of function performSearch()
          
          searchInput.addEventListener('keydown', function(event) { // originally 'keyup'
            if ((event.code === "Enter") || (event.code === "NumpadEnter")) {
              // if (event.keyCode === 13) { // Deprecated property: keyCode     
              performSearch();
            }
          });
        
          elSearchButton.addEventListener('click', function() {
              performSearch();
          });
        }); // End of chrome.tabs.query() - done collecting and processing all tabs
    }); // End of eBtnTabsInfo.addEventListener('click'...)
});

/*  
// ====================== ADDENDUM =================
[1] : Structure of "data" object in Browsing history

      // {
      //    id:             "2512"
      //    lastVisitTime:  1682213645641.652
      //    title:          "Google Images"
      //    typedCount:     0
      //    url:            "https://www.google.com/imghp?hl=en&tab=ri&ogbl"
      //    visitCount:     1
      // }

[2] : Structure of "fTab" object for Browser window Tab

        favIconUrl: "https://www.cbsnews.com/fly/bundles/cbsnewscore/icons/icon.svg?v=7976be32c7718021a8332cee4eb15ac6"
        id:         842656694
        incognito:  false
        index:      16
        status:     "unloaded"
        title:      "Update: Cash App founder, MobileCoin CPO Bob Lee stabbed to death in San Francisco's Rincon Hill neighborhood - CBS San Francisco"
        url:        "https://www.cbsnews.com/sanfrancisco/news/fatal-stabbing-bob-lee-mobile-coin-san-francisco-main-street-rincon-hill/"
        windowId:   842656676

[3] : Removed block

        data.forEach(function(page) {
          console.log(page);
          var tr = document.createElement('tr');
          var date = new Date(page.lastVisitTime);
          var time = date.toLocaleString();
          var time = fmtDate(date);// time.substring(
          var url = (page.url).substring(0, 80);
          current_count += 1;
          //tr.innerHTML = `<td>${current_count}</td><td width="200">${time}</td><td>${url}</td>`;
          // tr.innerHTML = '<td>' + time + '</td><td>' + url + '</td>';
          tr.innerHTML = '<td>' + current_count + '</td><td width="800">' + time + '</td><td>' + url + '</td>';          
          tableBody.appendChild(tr);
        });

[4] : html : search input string
      <!-- 
        <label for="name">Name (4 to 8 characters):</label>
        <input type="text" id="searchString" name="srchStr" required minlength="4" maxlength="8" size="10">
      -->

[5] : Web links not opening from popup window
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
