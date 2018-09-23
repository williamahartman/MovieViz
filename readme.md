# Movie Theater Data Viz

I've been using MoviePass for a little while, so I've seen a lot of movies in that past year. With the service falling apart, I thought it would be fun to take a look at all the data on all the movies I saw in theaters in 2017 and 2018.

The data is visualized with [D3](https://d3js.org/). All the data is pulled directly from a [Google Sheet](https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing) with [Tabletop.js](https://github.com/jsoma/tabletop) on page load. Some of the data in the sheet comes from [OMDb](http://www.omdbapi.com/), but most of it is stuff I entered myself with a Google Form. With this setup, anytime I add a new movie to the spreadsheet, the viz stays up to date.

I referenced [these](https://bl.ocks.org/mbostock/4063318) [projects](https://beta.observablehq.com/@mbostock/d3-calendar-view) for the calendar chart and [this project](https://bl.ocks.org/DimsumPanda/689368252f55179e12185e13c5ed1fee) for the stacked bar chart. I used [this CSS](http://thomasf.github.io/solarized-css/) for the Solarized Dark color scheme. SVG patterned fill adapted from [this project.](https://github.com/iros/patternfills)

## Setting up the Spreadsheet

The column names are used in the viz, so its probably simplest to start from a copy of [this spreadsheet](https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing).

The contents of the file `onFormSubmission.gs` need to attached to a trigger on the spreadsheet. This script goes through the spreadsheet and adds additional data from OMDb (the IMDb ID, the release date, and a poster URL). Data that is already present will not be overridden on any subsequent runs, so this can be manually modified if needed.

To add a custom script to a spreadsheet, click `Tools -> Script Editor`. Make a file and copy over the contents of the script in this repo. Go to `Edit -> Current project's triggers` and add a new trigger with the values `updateData`, `From spreadsheet`, and `On form submit`. I made a form for easier data entry, if you're entering your data some other way, you might want to use some other trigger.

For the script to work, you'll need to add an OMDb API key under the "Script properties" (under `File -> Project properties`) with the key `OMDB_API_KEY`. These keys are available [over here](http://www.omdbapi.com/apikey.aspx).

