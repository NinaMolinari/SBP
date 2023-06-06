// =================================================================
// FILE: favorites.js
// =================================================================

// Getting Search block control elements
// var searchInput       = document.getElementById('searchString');
var divSearchResults2  = document.getElementById('div_SearchResults');
var tableBody2         = document.getElementById('tblSearchResults');
var divSearchSummary2  = document.getElementById('div_SearchSummary');

//var gBookMarks         = [];
var gBookMarks         = new Array();
var matchedBMs         = [];
var gFBmNodes          = [];
var gBmCount           = 0;

// ==========================================================================
// Function searchFavorites():
// Shared between code modules by attaching to a global "Window" object:
// see: window.searchFavorites = searchFavorites;
// Alternatively consider exporting it as function searchFavorites(searchQuery)
// TODO: read Cross-Extension messaging:
//       https://developer.chrome.com/docs/extensions/mv3/messaging/#connect
// ==========================================================================
function searchFavorites(searchQuery) {

    // https://developer.mozilla.org/en-US/search?q=Bookmarks
    // https://stackoverflow.com/questions/2812622/get-google-chromes-root-bookmarks-folder
    // http://code.google.com/chrome/extensions/override.html

    divSearchSummary2.innerHTML = '';
    tableBody2.innerHTML = '';
    gBookMarks.length = 0;

    if ( searchQuery == '' ) { _listBookmarks(); return; }

    // Use the chrome.bookmarks API to search for favorite links
    chrome.bookmarks.search({ query: searchQuery }, function (results) {
      // Process the search results
      if (results.length > 0) {
        // Display the search results
        displaySearchResults(results);
        console.log(`chrome.bookmarks.search(): ${results}`);
      }
    });
}

// ==========================================================================
function _listBookmarks() {
    // ==========================================================================

    var bmCount = 0;
    var bmTitle = '';
    var linkText = '';
    var nMBMs   = 0;
    matchedBMs = [];
    var mBMs   = [];

    var mBM2s   = [];
    console.log('_listBookmarks1: ' + gBookMarks);
    // JSON.stringify(mBM2s));
    gBookMarks  = []; // gBookMarks.slice();
    console.log('_listBookmarks2: ' + gBookMarks);

    // ==========================================================================
    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
        gBmCount = 0;

        // Recursive function to flatten the bookmarks tree
        function flattenBookmarks(bookmarkNodes) {
            // console.log(`flatten1: ${mBM2s.length}`);
            for (const node of bookmarkNodes) {
                // Skip if the node doesn't have a URL (it is a folder)
                if (!node.url) {
                    // console.log(node);
                    if (node.children) {
                        // Recursively flatten the child nodes
                        flattenBookmarks(node.children);
                    }
                    continue;
                }

                // console.log(node);
                const xBookMark = {
                    id:             node.id,
                    parentId:       node.parentId,
                    dateAdded:      node.dateAdded, // dateCreated
                    title:          node.title,
                    url:            node.url
                }

                // gBookMarks.push(xBookMark);

                mBM2s.push(xBookMark);
                //gBookMarks[gBmCount]= xBookMark;
                gBmCount += 1;

                var tr = document.createElement('tr');
                bmTitle = node.title.replace(/</g,"&lt;");
                tr.innerHTML = '<td> (' + gBmCount + ')</td><td>'+ _formatDate2(xBookMark.dateAdded) + '</td><td><a href=' + xBookMark.url + '>[' + bmTitle.substring(0,72) + ']</a></td>';
                tableBody2.appendChild(tr);
                // console.log(`pushed node into bookmarks: ${node}`);
            }
            // console.log(`flatten2: ${mBM2s.length}`);
        }

        // Call the recursive function with the bookmark tree nodes
        flattenBookmarks(bookmarkTreeNodes);
        // console.log(`flatten3: ${mBM2s.length}`);
        gBookMarks = [...mBM2s];

        // Log the bookmarks to the console
        // console.log(`BookMarks: ${gBookMarks.length} `);
        divSearchSummary2.innerHTML = (`INFO: Total bookmars: [${gBookMarks.length}]`);
    }); // end of Bookmark Tree flattening
}

// ========================================================================
function _formatDate2 (date) {
    // ========================================================================
    // console.log(`formatDate:${date}`);

        nDate         = new Date(date);
        const year    = nDate.getFullYear();
        const month   = (nDate.getMonth() + 1).toString().padStart(2, '0');
        const day     = nDate.getDate().toString().padStart(2, '0');
        const hours   = nDate.getHours().toString().padStart(2, '0');
        const minutes = nDate.getMinutes().toString().padStart(2, '0');
        const seconds = nDate.getSeconds().toString().padStart(2, '0');
        return (`${year}.${month}.${day} ${hours}:${minutes}`);
        // return (`'${month}/${day} ${hours}:${minutes}`);
};

// ==========================================================================
// Function to display search results
// ==========================================================================
function displaySearchResults(results) {
    // Get the container element to display the search results
    // const resultsContainer = document.getElementById('favorites-results');
    tableBody2 = document.getElementById('tblSearchResults');

    // Clear any previous search results
    console.log(`Display: tableBody2: ${tableBody2}`);
    tableBody2.innerHTML = '';

    var bmCount = 0;
    // Iterate over the search results and create a list item for each bookmark
    for (const bm of results) {
        if (bm.url) {
            bmCount +=1;
            var tr = document.createElement('tr');
            tr.innerHTML = '<td> (' + bmCount + ')</td><td><a href=' + bm.url + '>[' + bm.title.substring(0,78) + ']</a></td>';
            tableBody2.appendChild(tr);
        }
    //   const listItem = document.createElement('li');
    //   listItem.textContent = result.title;
    //   tableBody2.appendChild(listItem);
    }
}

// ==========================================================================
// Function to handle no results found
// ==========================================================================
function handleNoResultsFound() {

    // Clear any previous search results
    console.log(`Display: tableBody2: ${tableBody2}`);


    // Get the container element to display the no results message
    tableBody2 = document.getElementById('tblSearchResults');
    tableBody2.innerHTML = '';

    // Display a message indicating no results were found
    const message = document.createElement('p');
    message.textContent = 'No results found.';
    tableBody2.appendChild(message);
}

// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
    // ==========================================================================
    //tableBody2  = document.getElementById('div_SearchResults');
    tableBody2         = document.getElementById('tblSearchResults');
    divSearchSummary2  = document.getElementById('div_SearchSummary');
    // console.log(`DOM loaded: tableBody2: ${tableBody2}`);
});

// Attach the searchFavorites function to the global window object
window.searchFavorites = searchFavorites;