//Load data from spreadsheet and draw graphs
var public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing";
Tabletop.init({ key: public_spreadsheet_url,
                callback: drawGraphs,
                simpleSheet: true });

function drawGraphs(data, tabletop) {
  // Define the div for the tooltip
  var tooltipDiv = d3.select("body")
                     .append("div")
                     .attr("class",    "tooltip")
                     .style("opacity", 0);

  //Clean up dates, add released/viewed date difference
  data = data.map(d => { 
    d.date = moment(d.date, "MM/D/YYYY");
    d.releaseDate = moment(d.releaseDate, "DD MMM YYYY")

    d.dateDiff = moment(d.date, "MM/D/YYYY").diff(d.releaseDate, "days");
    return d;
  });
  console.log(data);

  //Color schemes per category
  var color = d3.scaleOrdinal()
                .domain(["Moviepass", "Sinema", "Free Tickets", "Gift", "Accidental Scam", "None"])
                .range(["#d33682", "#2aa198", "#859900", "#b58900", "#6c71c4", "#586e75"]);

  //Draw Charts
  drawTextStats(data, "#text-stats");
  drawProfitGraph(data, "#moviepass-profit-graph", "Moviepass", "#d33682", 99.50, 885, 150, tooltipDiv);
  drawProfitGraph(data, "#sinema-profit-graph", "Sinema", "#2aa198", 179.88, 885, 150, tooltipDiv);
  drawCalendarChart(data, "#calendar-graph", d3.range(2017, 2019), color, 885, 136, 15, tooltipDiv);
  drawDateDiffBarGraph(data, "#date-diff-graph", color, 885, 600, tooltipDiv);
  drawTheaterGraph(data, "#theater-graph", color, 885, 250, tooltipDiv);
}

function drawTextStats(data, id) {
  d3.select(id)
    .append("p")
    .html(
      "<table style=\"border-collapse:collapse;text-align:left;\">" + 
        "<tr>" + 
          "<td style=\"color:#268bd2;font-size:25px;text-align:right;padding-bottom:30px\">" + data.length + "</td>" +
          "<td style=\"padding-left:15px;padding-bottom:30px\">movies in theaters since 1/1/2017</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#586e75;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "None").length + "</td>" +
          "<td style=\"padding-left:15px;\">tickets paid for normally</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#d33682;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "Moviepass").length + "</td>" +
          "<td style=\"padding-left:15px;\">tickets from MoviePass</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#2aa198;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "Sinema").length + "</td>" +
          "<td style=\"padding-left:15px;\">tickets from Sinema</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#859900;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "Free Tickets").length + "</td>" +
          "<td style=\"padding-left:15px;\">free tickets (passes from projector issues, work events, etc.)</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#b58900;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "Free Tickets (Cognex)").length + "</td>" +
          "<td style=\"padding-left:15px;\">tickets from Sarah's job</td>" +
        "</tr>" + 
        "<tr>" + 
          "<td style=\"color:#6c71c4;font-size:25px;text-align:right;\">" + data.filter(d => d.service === "Accidental Scam").length + "</td>" +
          "<td style=\"padding-left:15px;\">movies snuck into <span style=\"font-size:0.55em\">(I'm a little stinker...)</span></td>" +
        "</tr>" + 
      "</table>"
    );
}

//Draw a chart of profits
function drawProfitGraph(data, id, service, color, targetAmount, width, height, tooltip) {
  var svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 35, left: 20},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  var receivedAmount = data.filter(d => d.service === service)
                           .reduce((acc, val) => Number(val.price.replace(/[^0-9\.-]+/g,"")) + acc, 0);
  var profitData = [{service: service, value: receivedAmount}];

  //Scales
  var x = d3.scaleLinear().range([0, chartWidth]);
  var y = d3.scaleBand().range([chartHeight, 0]);

  x.domain([-0.5, receivedAmount > targetAmount ? receivedAmount * 1.333 : targetAmount * 1.333]);
  y.domain([service]).padding(0.1);

  //SVG setup
  var g = svg.attr("width", width)
             .attr("height", height)
             .append("g")
             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X axis
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
        .ticks(1)
        .tickSizeInner([10])
        .tickValues([targetAmount])
        .tickFormat(d => d3.format("$,.2f")(d) + " on " + service + " subscription"));
  
  //Price bar
  g.selectAll(".bar")
      .data(profitData)
    .enter()
      .append("rect")
      .attr("class",   "bar")
      .attr("fill",    color)
      .attr("x",       0)
      .attr("height",  y.bandwidth())
      .attr("y",       d => y(d.service))
      .attr("width",   d => x(d.value));

  //Text at end of bar
  g.selectAll(".text")  		
    .data(profitData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("fill",  "#93a1a1")
      .attr("x", d => x(d.value) + 10)
      .attr("y", d => y(d.service) + (y.bandwidth() / 2))
    .attr("font-size", 12)
      .text(d => d3.format("$,.2f")(d.value) + " in tickets from " + service);  
}

//Draw a calendar chart with moves on it.
function drawCalendarChart(data, id, yearRange, color, width, height, cellSize, tooltip) {
  const countDay = d => d.getDay(),
        formatDay = d => "SMTWRFS"[d.getDay()],
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  //SVG for the chart
  var svg = d3.select(id)
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
                  .attr("x",      d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize)
                  .attr("y",      d => d.getDay() * cellSize)
                  .datum(d3.timeFormat("%Y-%m-%d"));

  // Update days with viewing data
  data.forEach(datum => {
    rect.filter(d => moment(datum.date).isSame(d, "day"))
        .attr("fill",    d => color(datum.service))
        .attr("rx",      datum.premium === "No" ? 0 : cellSize / 2)
        .on("mouseout",  d => hideTooltip(tooltip))
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
     .data(d => d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)))
     .enter()
     .append("path")
     .attr("d", d => pathMonth(d, cellSize));

  // Year Labels
  svg.append("text")
      .attr("transform",   "translate(-25," + cellSize * 3.5 + ")rotate(-90)")
      .attr("font-family", "sans-serif")
      .attr("font-size",   10)
      .attr("text-anchor", "middle")
      .attr("fill",        "#93a1a1")
      .text(d => d);

  // Day Labels
  svg.attr("text-anchor", "end")
     .selectAll("text")
     .data((d3.range(8)).map(i => new Date(1995, 0, i)))
     .enter()
     .append("text")
     .attr("fill",        "#93a1a1")
     .attr("font-family", "sans-serif")
     .attr("font-size",   8)
     .attr("x",           -5)
     .attr("y",           d => countDay(d) * cellSize + (cellSize * 0.5))
     .attr("dy",          "0.31em")
     .text(formatDay);

  // Month Labels
  svg.selectAll(".legend")
     .data(months)
     .enter()
     .append("g")
     .attr("class",        "legend")
     .attr("transform",    (d, i) => "translate(" + (((i + 1) * cellSize * 4.333) - cellSize) + ", -5)")
     .append("text")
     .attr("class",        (d, i) => months[i])
     .attr("fill",         "#93a1a1")
     .attr("font-family",  "sans-serif")
     .attr("font-size",    10)
     .style("text-anchor", "end")
     .attr("dy",           "-.25em")
     .text((d, i) => months[i]);
}

//Draw a chart of movie date distances
function drawDateDiffBarGraph(data, id, color, width, height, tooltip) {
  var svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 30, left: 150},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  //Sort and filter data, find min/max
  data.sort((a, b) => b.dateDiff - a.dateDiff);
  var filteredData = data.filter(d => d.firstRun === "Yes")
                         .map(d => {
                           d.movieGraph = d.movie.length > 25 ? d.movie.substring(0,25)+"..." : d.movie;
                           return d;
                         });
  var minDiff = d3.min(filteredData, d => d.dateDiff);
  var maxDiff = d3.max(filteredData, d => d.dateDiff);
    
  //Scales
  var x = d3.scaleLinear().range([0, chartWidth]);
  var y = d3.scaleBand().range([chartHeight, 0]);
  x.domain([minDiff, maxDiff + 5]);
  y.domain(filteredData.map(d => d.movieGraph)).padding(0.1);

  //SVG setup
  var g = svg.attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X-axis
  var ticks = [];
  var i = 0;
  for(i = minDiff; i <= maxDiff + 5; i++) {
    if(i % 7 == 0) {
      ticks.push(i);
    }
  }
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
              .tickSizeInner([-chartHeight])
              .tickValues(ticks));

  //Y-axis
  g.append("g")
      .attr("class", "yaxis")
      .call(d3.axisLeft(y));
  
  //Date diff bars
  var moviesAdded = []
  g.selectAll(".bar")
      .data(filteredData)
    .enter()
      .append("rect")
      .attr("class",   "bar")
      .attr("fill",    d => {
        if(moviesAdded.find(m => m.movie === d.movie && m.service === d.service)) {
          return(d3.color(color(d.service)).darker().toString());
        } else {
          moviesAdded.push(d);
          return color(d.service);
        }
      })
      .attr("x",  d => d.dateDiff > 0 ? x(0) : d.dateDiff === 0 ? x(-0.25) : x(d.dateDiff))
      .attr("height",  y.bandwidth())
      .attr("y",       function(d) { return y(d.movieGraph); })
      .attr("width",   function(d) { 
        return d.dateDiff == 0 ? x(0.5) - x(0) : Math.abs(x(d.dateDiff) - x(0)); 
      })
      .on("mouseout",  d => hideTooltip(tooltip))
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, d, d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });
}

//Draw a graph of theater counts
function drawTheaterGraph(data, id, color, width, height, tooltip) {
  var svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 30, left: 180},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  //Data processing
  var theaterCounts = d3.nest()
                        .key(d => d.theater)
                        .key(d => d.service)
                        .rollup(v => v.length)
                        .entries(data);
  
  theaterCounts.map(d => {
    var zeroOrService = s => {
      var service = d.values.find(v => v.key === s);
      return service? service.value : 0;
    };
    color.domain().forEach(c => d[c] = zeroOrService(c))
    delete d.values;
    return d;
  });

  var getNumVisits = m => color.domain().reduce((acc, service) => m[service] + acc, 0);
  theaterCounts.sort((a, b) => getNumVisits(b) - getNumVisits(a));

  var maxVisits = d3.max(theaterCounts, d => getNumVisits(d));
  var stack = d3.stack().keys(color.domain())(theaterCounts);

  //Scales
  var x = d3.scaleLinear().range([0, chartWidth]);
  var y = d3.scaleBand().range([chartHeight, 0]);
  x.domain([0, maxVisits + 1]);
  y.domain(theaterCounts.map(d => d.key)).padding(0.1);

  //SVG Setup
  var g = svg.attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  //X-axis
  g.append("g")
   .attr("class", "xaxis")
   .attr("transform", "translate(0," + chartHeight + ")")
   .call(d3.axisBottom(x)
           .ticks(maxVisits)
           .tickSizeInner([-chartHeight]));

  //Y-axis
  g.append("g")
   .attr("class", "yaxis")
   .call(d3.axisLeft(y));

  //Stacked bars
  g.selectAll(".bar")
   .data(stack)
   .enter()
     .append("g")
     .attr("class", "bar")
     .attr("fill", d => color(d.key))
   .selectAll("rect")
   .data(d => d)
   .enter()
     .append("rect")
     .attr("x", d => x(d[0]))
     .attr("y", d => y(d.data.key))
     .attr("height", y.bandwidth())
     .attr("width", d => x(d[1]) - x(d[0]))
     .on("mouseout",  d => hideTooltip(tooltip))
     .on("mouseover", d => {
       var text = "<span style=\"font-weight: 900;\">" + d.data.key + ":</span> Visited " +
                  (d[1] - d[0]) + " time(s) with this service";
       updateTooltip(tooltip, d3.event.pageX, d3.event.pageY, text);
       showTooltip(tooltip);
     });
}



  ////////////////////////////////////////
 //      TOOLTIP/UTILITY FUNCTIONS     //
////////////////////////////////////////

function updateTooltipForMovie(tooltip, movie, xPos, yPos) {
  var dateDiffMessage;
  if(movie.dateDiff < -1) {
    dateDiffMessage = "<br/>(" + -movie.dateDiff + " days before widest release)";
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
          "<span style=\"font-weight: 900;\">PRICE: </span>" + d3.format("$,.2f")(movie.price) + "<br>" +
          "<span style=\"font-weight: 900;\">SERVICE?: </span>" + movie.service + "<br>" +
          "<span style=\"font-weight: 900;\">PREMIUM SCREENING?: </span>" + movie.premium + "<br><br>" +
          (movie.notes === "" ? "" : "<span style=\"font-weight: 900;\">NOTES: </span>" + movie.notes) +
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