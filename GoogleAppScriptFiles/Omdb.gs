function updateData() {
  //Sleep for a little while so there's time for the cell to get copied from the
  //"Form Responses" sheet to the "Movies" sheet.
  Utilities.sleep(1000);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];

  var range = sheet.getRange("$A$2:$Q1000");
  var rangeVals = range.getValues();
  var i;
  for(i = 0; i < rangeVals.length; i++) {
    var name = rangeVals[i][0];
    var year = rangeVals[i][1];
    var omdbDataColumns = "" + rangeVals[i][2] + rangeVals[i][3] + rangeVals[i][4] + rangeVals[i][5];

    if(!isEmpty(name) && isEmpty(omdbDataColumns)) {
      var currentRow = i + 2;
      sheet.getRange("$C$" + currentRow + ":$F" + currentRow).setValues([getOmdbData(name, year)]);
    }
  }
}

function getOmdbData(name, year) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty('OMDB_API_KEY');

  var reqUrl = 'http://www.omdbapi.com/?t=' + encodeURIComponent(name) + '&y=' + year + '&apikey=' + apiKey;
  var response = UrlFetchApp.fetch(reqUrl);
  var responseData = JSON.parse(response.getContentText());

  responseData.imdbID =   responseData.imdbID   || "";
  responseData.Released = responseData.Released || "";
  responseData.Poster =   responseData.Poster   || "";
  responseData.Runtime =  parseInt(responseData.Runtime)  || 0;

  return [responseData.Runtime, responseData.imdbID, responseData.Released, responseData.Poster];
}

function isEmpty(s) {
  return s == "" || s == null || s == undefined;
}
