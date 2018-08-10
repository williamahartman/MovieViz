function updateData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var range = sheet.getRange("$B$2:$O1000");
  var rangeVals = range.getValues();
  var i;
  for(i = 0; i < rangeVals.length; i++) {
    var name = rangeVals[i][0];
    var year = rangeVals[i][1];
    var omdbDataColumns = "" + rangeVals[i][11] + rangeVals[i][12] + rangeVals[i][13];
    
    if(!isEmpty(name) && isEmpty(omdbDataColumns)) {
      var currentRow = i + 2;
      sheet.getRange("$M$" + currentRow + ":$O" + currentRow).setValues([getOmdbData(name, year)]);
    }
  }
}

function getOmdbData(name, year) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty('OMDB_API_KEY');
    
  var reqUrl = 'http://www.omdbapi.com/?t=' + encodeURIComponent(name) + '&y=' + year + '&apikey=' + apiKey;
  var response = UrlFetchApp.fetch(reqUrl);
  var responseData = JSON.parse(response.getContentText());
  
  return [responseData.imdbID, responseData.Released, responseData.Poster];
}

function isEmpty(s) {
  return s == "" || s == null || s == undefined;
}
