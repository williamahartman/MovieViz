# Movie Theater Data Viz

I've been using MoviePass for a little while, so I've seen a lot of movies in that past year. With the service falling apart, I thought it would be fun to take a look at all the data on all the movies I saw in theaters in 2017 and 2018.

The data is visualized with [D3](https://d3js.org/). All the data is pulled directly from a [Google Sheet](https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing) with [Tabletop.js](https://github.com/jsoma/tabletop) on page load. Some of the data in the sheet comes from [OMDb](http://www.omdbapi.com/), but most of it is stuff I entered myself with a Google Form. With this setup, anytime I add a new movie to the spreadsheet, the viz stays up to date.

I referenced [these](https://bl.ocks.org/mbostock/4063318) [projects](https://beta.observablehq.com/@mbostock/d3-calendar-view) for the calendar chart and [this project](https://bl.ocks.org/DimsumPanda/689368252f55179e12185e13c5ed1fee) for the stacked bar chart. I used [this CSS](http://thomasf.github.io/solarized-css/) for the Solarized Dark color scheme.