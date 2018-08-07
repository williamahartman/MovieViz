var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing';

var dataset;
Tabletop.init({ key: public_spreadsheet_url,
                callback: drawGraphs,
                simpleSheet: true
              })
//Draw all the graphs
function drawGraphs(data, tabletop) {
  // Define the div for the tooltip
  var tooltipDiv = d3.select("body")
                     .append("div")
                     .attr("class",    "tooltip")
                     .style("opacity", 0);

  //Clean up dates, add difference
  data = data.map(d => { 
    d.date = moment(d.date, "MM/D/YYYY");
    d.releaseDate = moment(d.releaseDate, "DD MMM YYYY")

    d.dateDiff = moment(d.date, "MM/D/YYYY").diff(d.releaseDate, "days");
    return d;
  });
  console.log(data);

  //Draw Charts
  drawCalendarChart(data, d3.range(2017, 2019), 885, 136, 15, tooltipDiv);
  drawDateDiffBarGraph(data, 885, 500, tooltipDiv);
  drawTheaterGraph(data, 885, 350, tooltipDiv);
}

//Draw a calendar chart with moves on it.
function drawCalendarChart(data, yearRange, width, height, cellSize, tooltip) {
  const countDay = d => d.getDay(),
        formatDay = d => "SMTWRFS"[d.getDay()],
        formatMonth = d3.timeFormat("%b"),
        formatPercent = d3.format(".1%"),
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var color = d3.scaleOrdinal()
                .domain(["Moviepass", "Sinema", "Free Tickets", "Free Tickets (Cognex)", "Accidental Scam", "None"])
                .range(["#d33682", "#2aa198", "#859900", "#b58900", "#6c71c4", "#586e75"]);

  //SVG for the chart
  var svg = d3.select("#calendar-graph")
              .attr("class", "calendar-chart")
              .selectAll("svg")
              .data(yearRange)
              .enter()
                .append("svg")
                .attr("width",  width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

  // Days
  var rect = svg.append("g")
                .attr("fill",   "#073642")
                .attr("stroke", "#002b36")
                .selectAll("rect")
                .data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter()
                  .append("rect")
                  .attr("width",  cellSize)
                  .attr("height", cellSize)
                  .attr("x",      d => { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
                  .attr("y",      d => { return d.getDay() * cellSize; })
                  .datum(d3.timeFormat("%Y-%m-%d"));

  // Update days with viewing data
  data.forEach(datum => {
    rect.filter(d => { return moment(datum.date).isSame(d, 'day'); })
        .attr("fill",    d => { return color(datum.service); })
        .attr("rx",      datum.premium === "No" ? 0 : cellSize / 2)
        .on("mouseout",  d => { hideTooltip(tooltip) })
        .on("mouseover", d => {
          updateTooltipForMovie(tooltip, datum, d3.event.pageX, d3.event.pageY);
          showTooltip(tooltip);
        });
  });

  // Months
  svg.append("g")
     .attr("fill",   "none")
     .attr("stroke", "#586e75")
     .selectAll("path")
     .data(d => { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
     .enter()
     .append("path")
     .attr("d", d => { return pathMonth(d, cellSize); });

  // Year Labels
  svg.append("text")
      .attr("transform",   "translate(-25," + cellSize * 3.5 + ")rotate(-90)")
      .attr("font-family", "sans-serif")
      .attr("font-size",   10)
      .attr("text-anchor", "middle")
      .attr("fill",        "#93a1a1")
      .text(d => { return d; });

  // Day Labels
  svg
     .attr("text-anchor", "end")
     .selectAll("text")
     .data((d3.range(7)).map(i => new Date(1995, 0, i)))
     .enter()
     .append("text")
     .attr("fill",        "#93a1a1")
     .attr("font-family", "sans-serif")
     .attr("font-size",   8)
     .attr("x",           -5)
     .attr("y",           d => (countDay(d) + 0.5) * cellSize)
     .attr("dy",          "0.31em")
     .text(formatDay);

  // Month Labels
  svg.selectAll(".legend")
     .data(months)
     .enter()
     .append("g")
     .attr("class",        "legend")
     .attr("transform",    (d, i) => { return "translate(" + (((i + 1) * cellSize * 4.333) - cellSize) + ", -5)"; })
     .append("text")
     .attr("class",        (d, i) => { return months[i] })
     .attr("fill",         "#93a1a1")
     .attr("font-family",  "sans-serif")
     .attr("font-size",    10)
     .style("text-anchor", "end")
     .attr("dy",           "-.25em")
     .text((d, i) => { return months[i] });
}

//Draw a chart of movie date distances
function drawDateDiffBarGraph(data, width, height, tooltip) {
  var svg = d3.select("#date-diff-graph"),
      margin = {top: 20, right: 20, bottom: 30, left: 150},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  data.sort((a, b) => { return b.dateDiff - a.dateDiff; });
  filteredData = data.filter(d => { return d.firstRun === "Yes"; })
                     .map(d => {
                       d.dateDiffGraph = d.dateDiff;
                       d.dateDiffGraph = d.dateDiff <= -7 ? -6.75 : d.dateDiffGraph;
                       d.dateDiffGraph = d.dateDiff > 56 ? 56.5 : d.dateDiffGraph;
                       d.movie = d.movie.length > 25 ? d.movie.substring(0,25)+'...' : d.movie;
                       return d;
                     });
    
  var x = d3.scaleLinear().range([0, chartWidth]);
  var y = d3.scaleBand().range([chartHeight, 0]);
  var color = d3.scaleOrdinal()
                .domain(["Moviepass", "Sinema", "Free Tickets", "Free Tickets (Cognex)", "Accidental Scam", "None"])
                .range(["#d33682", "#2aa198", "#859900", "#b58900", "#6c71c4", "#586e75"]);

  var g = svg.attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  x.domain([-7, 56]);
  y.domain(filteredData.map(d => { return d.movie; })).padding(0.1);

  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSizeInner([-chartHeight])
        .tickValues([-7, 0, 7, 14, 21, 28, 35, 42, 49, 56]));

  g.append("g")
      .attr("class", "yaxis")
      .call(d3.axisLeft(y));
  
  var moviesAdded = []
  g.selectAll(".bar")
      .data(filteredData)
    .enter().append("rect")
      .attr("class",   "bar")
      .attr("fill",    d => {
        if(moviesAdded.find(m => {return m.movie === d.movie && m.service === d.service; })) {
          return(d3.color(color(d.service)).darker().toString());
        } else {
          moviesAdded.push(d);
          return color(d.service);
        }
      })
      .attr("x",       0)
      .attr("height",  y.bandwidth())
      .attr("y",       function(d) { return y(d.movie); })
      .attr("width",   function(d) { return x(d.dateDiffGraph); })
      .on("mouseout",  d => { hideTooltip(tooltip) })
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, d, d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });
}

//Draw a graph of theater counts
function drawTheaterGraph(data, width, height, tooltip) {
  var svg = d3.select("#theater-graph"),
      margin = {top: 20, right: 20, bottom: 30, left: 180},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  var theaterCounts = d3.nest()
                        .key(d => { return d.theater; })
                        .key(d => { return d.service; })
                        .rollup(v => { return v.length; })
                        .entries(data);
  
  theaterCounts.sort((a, b) => { return b.value - a.value; });
  theaterCounts.map(d => {
    var zeroOrService = s => {
      var service = d.values.find(v => v.key === s);
      return service? service.value : 0;
    };

    d.moviepass = zeroOrService("Moviepass");
    d.sinema = zeroOrService("Sinema");
    d.free = zeroOrService("Free Tickets");
    d.cognex = zeroOrService("Free Tickets (Cognex)");
    d.scam = zeroOrService("Accidental Scam");
    d.none = zeroOrService("None");
    delete d.values;
    return d;
  });
  var maxVisits = d3.max(theaterCounts, d => { return d.moviepass + d.sinema + d.free + d.cognex + d.scam + d.none; });
    
  var x = d3.scaleLinear().range([0, chartWidth]);
  var y = d3.scaleBand().range([chartHeight, 0]);
  var z = d3.scaleOrdinal()
            .range(["#d33682", "#2aa198", "#859900", "#b58900", "#6c71c4", "#586e75"]);

  var g = svg.attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var stack = d3.stack().keys(["moviepass" ,"sinema" ,"free" ,"cognex" ,"scam" , "none"])(theaterCounts);
  x.domain([0, maxVisits]);
  y.domain(theaterCounts.map(d => { return d.key; })).padding(0.1);
  z.domain(["moviepass", "sinema", "free", "cognex", "scam", "none"]);

  console.log(theaterCounts);
  console.log(stack);

  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
        .ticks(maxVisits)
        .tickSizeInner([-chartHeight]));

  g.append("g")
      .attr("class", "yaxis")
      .call(d3.axisLeft(y));

  g.selectAll(".bar")
    .data(stack)
    .enter().append("g")
      .attr("class", "bar")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(d => { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return x(d[0]); })
      .attr("y", function(d) { return y(d.data.key); })
      .attr("height", y.bandwidth())
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })
      .on("mouseout",  d => { hideTooltip(tooltip) })
      .on("mouseover", d => {
        var text = "<span style=\"font-weight: 900;\">" + d.data.key + ":</span> Visited" +
                   (d[1] - d[0]) + " times with this service";
        updateTooltip(tooltip, d3.event.pageX, d3.event.pageY, text);
        showTooltip(tooltip);
      });; 
}



  ////////////////////////////////////////
 //      TOOLTIP/UTILITY FUNCTIONS     //
////////////////////////////////////////

function updateTooltipForMovie(tooltip, movie, xPos, yPos) {
  var dateDiffMessage;
  if(movie.dateDiff < -1) {
    dateDiffMessage = "<br/>(" + -movie.dateDiff + " days before wide release)";
  }
  else if(movie.dateDiff === -1) {
    dateDiffMessage = "<br/>(Thursday preview)";
  } else if(movie.dateDiff === 0) {
    dateDiffMessage = "<br/>(Opening night)";
  } else {
    dateDiffMessage = "<br/>(" + movie.dateDiff + " days after release)";
  }

  var movieTooltipHtml =
    "<div style=\"display:flex; flex-direction:column;\">" +
    "<span style=\"font-size:1.5em;text-align:center;margin-bottom:10px;\">" + movie.movie + "</span>" +
    "<div style=\"display:flex\";>" +
    "<div>" +
    "<img src=\"" + movie.posterUrl + "\" style=\"width:100px;margin-right:10px;\">" +
    "</div>" +
    "<div>" +
    "<span style=\"font-weight: 900;\">DATE RELEASED: </span>" + moment(movie.releaseDate).format("M/D/YYYY") + "<br>" +
    "<span style=\"font-weight: 900;\">DATE WATCHED: </span>" + moment(movie.date).format("M/D/YYYY") + dateDiffMessage + "<br>" +
    "<span style=\"font-weight: 900;\">THEATER: </span>" + movie.theater + "<br/>" +
    (movie.theaterNumber === "" ? "<br/>" : "<span style=\"font-weight: 900;\">THEATER NUMBER: </span>" + movie.theaterNumber + "<br><br>") +
    "<span style=\"font-weight: 900;\">PRICE: </span>" + movie.price + "<br>" +
    "<span style=\"font-weight: 900;\">SERVICE?: </span>" + movie.service + "<br>" +
    "<span style=\"font-weight: 900;\">PREMIUM SCREENING?: </span>" + movie.premium + "<br><br>" +
    (movie.notes === "" ? "" : "<span style=\"font-weight: 900;\">NOTES: </span>" + movie.notes + "<br>") +
    "</div>" +
    "</div>" +
    "</div>";

  updateTooltip(tooltip, xPos, yPos, movieTooltipHtml);
}

function updateTooltip(tooltip, xPos, yPos, toolTipHtml) {
  tooltip.html(toolTipHtml)
         .style("left", xPos + "px")
         .style("top", yPos + "px");
}

function showTooltip(tooltip) {
  tooltip.transition()
      .duration(200)
      .style("opacity", .9);
}

function hideTooltip(tooltip) {
  tooltip.transition()
      .duration(250)
      .style("opacity", 0);
}

function pathMonth(t0, cellSize) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
    d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
    d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
    + "H" + w0 * cellSize + "V" + 7 * cellSize
    + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
    + "H" + (w1 + 1) * cellSize + "V" + 0
    + "H" + (w0 + 1) * cellSize + "Z";
}