function updateRatings() {
  var ratingsData = getRatings();
    
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var range = sheet.getRange("$D$2:$P1000");
  var rangeVals = range.getValues();
  var i;
  for(i = 0; i < rangeVals.length; i++) {
    var cellImdbId = rangeVals[i][0];
    var rating;
    ratingsData.forEach(function(i) {
      if(i.imdbId === cellImdbId) {
        rating = i;
        return;
      }
    });
    
    if(rating) {
      var currentRow = i + 2;
      sheet.getRange("P" + currentRow).setValue(rating.rating);
    }
    if(rating && rating.review) {
      var currentRow = i + 2;
      sheet.getRange("Q" + currentRow).setValue("https://boxd.it/" + rating.review);
    }
    rating = undefined;
  }
}

function getRatings() {
  //Get API properties
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey    = scriptProperties.getProperty('LETTERBOXD_API_KEY');
  var apiSecret = scriptProperties.getProperty('LETTERBOXD_API_SECRET');
  var userId    = scriptProperties.getProperty('LETTERBOXD_USER_ID');

  var letterboxdData = [];
  
  //Go through the cursored list of films. One extra request needs to be made.
  var perPage = 100;
  var cursor = 0;
  var reqResults = [];
  do {
    var url = "https://api.letterboxd.com/api/v0/films?" +
              "includeFriends=None" +
              "&memberRelationship=Watched" +
              "&sort=ReleaseDateLatestFirst" +
              "&perPage=" + perPage +
              "&cursor=start=" + cursor + 
              "&member=" + userId;
    var signedUrl = signLetterboxdUrl(url, apiKey, apiSecret, "GET", "");
    var response = UrlFetchApp.fetch(signedUrl);
    reqResults = JSON.parse(response.getContentText()).items;
    letterboxdData = letterboxdData.concat(reqResults);
    cursor += perPage;
  } while (reqResults.length > 0);
  
  //Filter it down to the just the relevant information
  var ratings = []
  letterboxdData.forEach(function(i) {
    var imdbId;
    i.links.forEach(function(j) {
      if(j.type == "imdb") {
        imdbId = j.id;
        return;
      }
    });
    
    if(imdbId != null) {
      ratings.push({
        imdbId: imdbId,
        rating: i.relationships[0].relationship.rating,
        review: i.relationships[0].relationship.reviews[0]
      });
    }
  });
  return ratings;
}

function signLetterboxdUrl(unsignedUrl, apiKey, apiSecret, method, body) {
  var timestamp = Math.floor((new Date()).getTime()/1000);
  var nonce     = Utilities.getUuid();
  var url = unsignedUrl + "&apikey=" + apiKey + "&timestamp=" + timestamp + "&nonce=" + nonce;
  
  var signatureString = method + "\u0000" + url + "\u0000" + body;
  var signature = hmacSha256(signatureString, apiSecret);
  var signedUrl = url + "&signature=" + signature;
  
  return signedUrl;
}

function hmacSha256(value, key) {
  var signatureBytes = Utilities.computeHmacSha256Signature(value, key);
  var signature = signatureBytes.reduce(function(acc, val) {
    if (val < 0) val += 256;
    var byteStr = val.toString(16);
    if (byteStr.length == 1) byteStr = '0'+ byteStr;
    return acc + byteStr;
  }, "")
  return signature;
}
