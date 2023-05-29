// Search block
// var tableBody         = document.getElementById('tblSearchResults');
// var searchInput       = document.getElementById('searchString');
var divSearchResults2  = document.getElementById('div_SearchResults');
var tableBody2         = document.getElementById('tblSearchResults');
var divSearchSummary2  = document.getElementById('div_SearchSummary');
var gBookMarks         = [];
var matchedBMs         = [];

// var divSearchSummary  = document.getElementById('div_SearchSummary');

// ==========================================================================
// Define the searchFavorites function
// export function searchFavorites(searchQuery) { // now using Window.function() binding instead...
// ==========================================================================
function searchFavorites(searchQuery) {
    // Use the chrome.bookmarks API to search for favorite links

    // https://stackoverflow.com/questions/2812622/get-google-chromes-root-bookmarks-folder
    // https://stackoverflow.com/questions/2812622/get-google-chromes-root-bookmarks-folder
    // http://code.google.com/chrome/extensions/override.html


    chrome.bookmarks.search({ query: searchQuery }, function (results) {
        gBookMarks = results;
      // Process the search results
      if (results.length > 0) {
        // Display the search results
        displaySearchResults(results);
        console.log(`DOM loaded: tableBody2: ${results}`);
      } else {
        // Handle no results found
        handleNoResultsFound();
      }
    });

    var bmCount = 0;
    var bmTitle = '';
    var linkText = '';
    var nMBMs   = 0;
    matchedBMs = [];

    for (const bm of gBookMarks) {
    //gBookMarks.forEach (function (bm) {
        bmCount +=1 ;
        var tr = document.createElement('tr');
        // console.log( " original: " + tCount ":" +  mTab.title );
        // console.log( ` original: ${tCount} :  ${mTab.title}` );
        bmTitle = bm.title.replace(/</g,"&lt;");
        // if (gLinkDisplayMode == 'mode_Display_TITLE') {
        //   linkText = bmTitle;
        // }else{
        //   linkText = bm.url.substring(0,78) ;
        // }


        if (bm.url) {
            console.log( bm.title );
            if ((bm.url.indexOf(searchQuery) !== -1) || (bm.title.indexOf(searchQuery) !== -1)) {
                matchedBMs.push(bm);
            }
        }

        tr.innerHTML = '<td> (' + bmCount + ')</td><td><a href=' + bm.url + '>[' + linkText + ']</a></td>';
        tableBody2.appendChild(tr);
    } //);

      nMBMs = matchedBMs.length;
      divSearchSummary2.innerHTML = (`INFO: ${bmCount} BMs matched out of ${gBookMarks.length}`);


}

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