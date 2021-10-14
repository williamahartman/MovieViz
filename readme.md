# Movie Theater Data Viz

I've been using MoviePass for a little while, so I've seen a lot of movies in that past year. With the service falling apart, I thought it would be fun to take a look at all the data on all the movies I saw in theaters in 2017 and 2018.

The data is visualized with [D3](https://d3js.org/). All the data is pulled directly from a [Google Sheet](https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing) with [Papa Parse](https://www.papaparse.com/) on page load. Some of the data in the sheet comes from [OMDb](http://www.omdbapi.com/), but most of it is stuff I entered myself with a Google Form. The ratings are pulled in from my Letterboxd account. With this setup, anytime I add a new movie to the spreadsheet, the viz updates automatically.

I referenced [these](https://bl.ocks.org/mbostock/4063318) [projects](https://bl.ocks.org/micahstubbs/89c6bd879d64aa511372064c6cf85711) for the calendar chart and [this project](https://bl.ocks.org/DimsumPanda/689368252f55179e12185e13c5ed1fee) for the stacked bar chart. I used [this stylesheet](http://thomasf.github.io/solarized-css/) for the Solarized Dark color scheme. SVG patterned fills were adapted from [this project.](https://github.com/iros/patternfills)

## Setting up the Spreadsheet

The column names are used in the viz, so its probably simplest to start from a copy of [this spreadsheet](https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing). You'll need to select "Publish to the web" to make the csv file available.

In `charts.js` you need to add this information:
- The public URL of the sheet. This is the one you'll see under the "Publish to the web" menu, not the one you edit from. It should have `2PACX` in it.
- The `gid`s of the the four relevant worksheets ("Movies", "Memberships", "Events", and "Spans"). You can find these values by looking for the `gid=` in the URL when editing that worksheet in Google Drive.

### Setting up OMDb

The contents of the file `Omdb.gs` need to attached to a trigger on the spreadsheet. This script goes through the spreadsheet and adds additional data from OMDb (the IMDb ID, the release date, and a poster URL). Data that is already present will not be overridden on any subsequent runs, so things can be manually modified if anything is incorrect.

To add a custom script to a spreadsheet, click `Tools -> Script Editor`. Make a file and copy over the contents of the script in this repo. Go to `Edit -> Current project's triggers` and add a new trigger with the values `updateData`, `From spreadsheet`, and `On form submit`. I made a form for easier data entry, if you're entering your data some other way, you might want to use some other trigger.

For the script to work, you'll need to add an OMDb API key under the "Script properties" (under `File -> Project properties` — you can only set these the old editor UI, so opt out of the new one) with the key `OMDB_API_KEY`. These keys are available [over here](http://www.omdbapi.com/apikey.aspx).

## Setting up Letterboxd

Same as with OMDb, if you want to pull reviews from your Letterboxd account, you'll need to add the contents of the `Letterboxd.gs` file on a trigger. You'll also need to add the `Crypto.gs` file to your AppScript project. I have this one run nightly instead of when I submit the form. I tend to enter data while I'm waiting for the movie to start — and I certainly wouldn't rate something before I saw it!

You'll need a Letterboxd API key and secret for this to work. They list an email address [over here](https://letterboxd.com/api-beta/), but they weren't super responsive for me. You might have to get a little creative to get the info you need...

They changed these at some point semi-recently. If you need a little hint, both the API key and secret are now 64 char hex strings. I'm sure this is all very against the rules, so like... buy a Letterboxd pro subscription to make up for it maybe?

Just like OMDb, you'll need some stuff under the "Script properties":
- Your API key under `LETTERBOXD_API_KEY`
- Your API secret under `LETTERBOXD_API_SECRET`
- Your Letterboxd user ID under `LETTERBOXD_USER_ID`

Of course, if this stuff is too much of a pain, you can just enter your ratings in the spreadsheet manually. If you aren't already a Letterboxd user, this isn't a huge loss.
