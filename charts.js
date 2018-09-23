//Load data from spreadsheet and draw graphs
let public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing";
Tabletop.init({ key: public_spreadsheet_url,
                callback: drawGraphs,
                simpleSheet: true });
            
function drawGraphs(data, tabletop) {
  // Define the div for the tooltip
  let tooltipDiv = d3.select("body")
                     .append("div")
                     .attr("class",    "tooltip")
                     .style("opacity", 0);

  //Clean up data
  data = data.map(d => { 
    d.date = moment(d.date, "MM/D/YYYY");
    d.releaseDate = moment(d.releaseDate, "DD MMM YYYY")
    d.dateDiff = moment(d.date, "MM/D/YYYY").diff(d.releaseDate, "days");
    d.firstRun = d.firstRun === "Yes";
    d.isPremium = d.premium !== "No";
    d.serviceName = d.service;
    d.service = "service-" + d.service.toLowerCase().replace(" ", "-")
    return d;
  });
  console.log(data);

  //Generate the hatched patterned fills for each service
  genPatternedFills(data);

  //Figure out year range
  firstYear = d3.min(data, d => moment(d.date).year());
  lastYear =  d3.max(data, d => moment(d.date).year());

  //Draw Charts
  drawTextStats(data, firstYear, "#text-stats");
  drawCalendarChart(data, "#calendar-graph", d3.range(firstYear, lastYear + 1), 885, 136, 15, tooltipDiv);
  drawDateDiffBarGraph(data, "#date-diff-graph", 885, 600, tooltipDiv);
  drawTheaterGraph(data, "#theater-graph", 885, 250, tooltipDiv);
  drawProfitGraph(data, "#moviepass-profit-graph", "service-moviepass", "Moviepass", 99.50, false, 885, 175);
  drawProfitGraph(data, "#sinemia-profit-graph", "service-sinemia", "Sinemia", 179.88, true, 885, 175);
}

function drawTextStats(data, startYear, id) {
  let numMovies = data.length;
  let numNoService = data.filter(d => d.service === "service-none").length;
  let numMoviepass = data.filter(d => d.service === "service-moviepass").length;
  let numSinemia = data.filter(d => d.service === "service-sinemia").length;
  let numFree = data.filter(d => d.service === "service-free-tickets").length;
  let numGift = data.filter(d => d.service === "service-gift").length;
  let numSneak = data.filter(d => d.service === "service-snuck-in").length;

  d3.select(id)
    .append("p")
    .html(
      "<table style=\"border-collapse:collapse;text-align:left;\">" + 
        "<tr>" + 
          "<td style=\"color:#268bd2;font-size:25px;text-align:right;padding-bottom:30px\">" + numMovies + "</td>" +
          "<td style=\"padding-left:15px;padding-bottom:30px\">movies in theaters since 1/1/" + startYear + "</td>" +
        "</tr>" + 
      "</table>" +
      "<div style=\"display: flex;\">" + 
        "<table style=\"border-collapse:collapse;text-align:left;margin-right:50px\">" + 
          "<tr>" + 
            "<td class=\"service-none\" style=\"font-size:25px;text-align:right;\">" + numNoService + "</td>" +
            "<td style=\"padding-left:15px;\">" + (numNoService == 1 ? "ticket" : "tickets") + " paid for normally</td>" +
          "</tr>" + 
          "<tr>" + 
            "<td class=\"service-snuck-in\" style=\"font-size:25px;text-align:right;\">" + numSneak + "</td>" +
            "<td style=\"padding-left:15px;\">" + (numSneak == 1 ? "movie" : "movies") + " snuck into <span style=\"font-size:0.55em\">(I'm a little stinker...)</span></td>" +
          "</tr>" + 
        "</table>" +
        "<table style=\"border-collapse:collapse;text-align:left;margin-right:50px\">" + 
          "<tr>" + 
            "<td class=\"service-moviepass\" style=\"font-size:25px;text-align:right;\">" + numMoviepass + "</td>" +
            "<td style=\"padding-left:15px;\">" + (numMoviepass == 1 ? "ticket" : "tickets") + " from MoviePass</td>" +
          "</tr>" + 
          "<tr>" + 
            "<td class=\"service-gift\" style=\"font-size:25px;text-align:right;\">" + numGift + "</td>" +
            "<td style=\"padding-left:15px;\">" + (numGift == 1 ? "ticket" : "tickets") + " received as gifts</td>" +
          "</tr>" + 
        "</table>" +
        "<table style=\"border-collapse:collapse;text-align:left;\">" +
          "<tr>" + 
            "<td class=\"service-sinemia\" style=\"font-size:25px;text-align:right;\">" + numSinemia + "</td>" +
            "<td style=\"padding-left:15px;\">" + (numSinemia == 1 ? "ticket" : "tickets") + " from Sinemia</td>" +
          "</tr>" + 
          "<tr>" + 
            "<td class=\"service-free-tickets\" style=\"font-size:25px;text-align:right;\">" + numFree + "</td>" +
            "<td style=\"padding-left:15px;\">free " + (numFree == 1 ? "ticket" : "tickets") + " (passes, promotions, etc.)</td>" +
          "</tr>" + 
        "</table>" +
      "</div>"
    );
}

//Draw a calendar chart with movies on it.
function drawCalendarChart(data, id, yearRange, width, height, cellSize, tooltip) {
  const countDay = d => d.getDay(),
        formatDay = d => "SMTWRFS"[d.getDay()],
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  //SVG for the chart
  let svg = d3.select(id)
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
  let rect = svg.append("g")
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
                  .datum(d3.timeFormat("%Y-%m-%d"))

  // Update days with viewing data
  data.forEach(datum => {
    let sameDayMovies = data.filter(d => moment(d.date).isSame(datum.date));
    rect.filter(d => moment(datum.date).isSame(d, "day"))
        .classed(datum.service, !datum.isPremium)
        .attr("fill", () => "url(#" + datum.service + "-stripe)")
        .on("mouseout",  () => hideTooltip(tooltip))
        .on("mouseover", () => {
          updateTooltipForMovie(tooltip, sameDayMovies, d3.event.pageX, d3.event.pageY);
          showTooltip(tooltip);
        });

    if(sameDayMovies.length > 1) {
    }
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

  // Double/Triple/etc. Feature Labels
  svg.append("g")
     .selectAll("rect")
     .data(function (d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
     .enter()
       .append("text")
       .attr("x",      d => (d3.timeWeek.count(d3.timeYear(d), d) * cellSize) + (cellSize / 2))
       .attr("y",      d => (d.getDay() * cellSize) + (cellSize / 2))
       .attr("font-family", "sans-serif")
       .attr("font-size",   14)
       .attr("text-anchor", "middle")
       .attr("fill",        "#eee8d5")
       .classed("double-feature-text", true)
       .text(d => {
         let numMovies = data.filter(datum => moment(datum.date).isSame(d, "day")).length;
         return numMovies > 1 ? numMovies : "";
       })
       .on("mouseout",  () => hideTooltip(tooltip))
       .on("mouseover", d => {
         let sameDayMovies = data.filter(datum => moment(datum.date).isSame(d, "day"));
         updateTooltipForMovie(tooltip, sameDayMovies, d3.event.pageX, d3.event.pageY);
         showTooltip(tooltip);
       });;

}

//Draw a chart of movie date distances
function drawDateDiffBarGraph(data, id, width, height, tooltip) {
  let svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 30, left: 150},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  //Sort and filter data, find min/max
  data.sort((a, b) => b.dateDiff - a.dateDiff);
  let filteredData = data.filter(d => d.firstRun)
                         .map(d => {
                           d.movieGraph = d.movie.length > 25 ? d.movie.substring(0,25)+"..." : d.movie;
                           return d;
                         });
  let minDiff = d3.min(filteredData, d => d.dateDiff);
  let maxDiff = d3.max(filteredData, d => d.dateDiff);
    
  //Scales
  let x = d3.scaleLinear().range([0, chartWidth]);
  let y = d3.scaleBand().range([chartHeight, 0]);
  x.domain([minDiff, maxDiff + 5]);
  y.domain(filteredData.map(d => d.movieGraph)).padding(0.1);

  //SVG setup
  let g = svg.attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X-axis
  let ticks = [];
  let i = 0;
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
  let moviesAdded = []
  g.selectAll(".bar")
      .data(filteredData)
    .enter()
      .append("rect")
      .attr("fill", d => "url(#" + d.service + "-stripe)")
      .attr("class",  d => {
        let darker = "";
        if(moviesAdded.find(m => m.movie === d.movie && m.service === d.service)) {
          darker = "darker";
        } else {
          moviesAdded.push(d);
        }
        return (d.isPremium ? "" : d.service + " ") + darker;
      })
      .classed("bar", true)
      .attr("x",  d => d.dateDiff > 0 ? x(0) : d.dateDiff === 0 ? x(-0.25) : x(d.dateDiff))
      .attr("height",  y.bandwidth())
      .attr("y",       d => y(d.movieGraph))
      .attr("width",   d => { 
        return d.dateDiff == 0 ? x(0.5) - x(0) : Math.abs(x(d.dateDiff) - x(0)); 
      })
      .on("mouseout",  () => hideTooltip(tooltip))
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });
}

//Draw a graph of theater counts
function drawTheaterGraph(data, id, width, height, tooltip) {
  let svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 30, left: 180},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  serviceList = getServiceList(data);
  serviceList.sort((a, b) => data.filter(d => b === d.service).length - data.filter(d => a === d.service).length);

  //Data processing
  let theaterCounts = d3.nest()
                        .key(d => d.theater)
                        .key(d => d.service)
                        .rollup(v => v.length)
                        .entries(data);
  
  theaterCounts.map(d => {
    let zeroOrService = s => {
      let service = d.values.find(v => v.key === s);
      return service ? service.value : 0;
    };
    serviceList.forEach(c => d[c] = zeroOrService(c))
    delete d.values;
    return d;
  });

  let getNumVisits = m => serviceList.reduce((acc, service) => m[service] + acc, 0);
  theaterCounts.sort((a, b) => getNumVisits(b) - getNumVisits(a));

  let maxVisits = d3.max(theaterCounts, d => getNumVisits(d));
  let stack = d3.stack().keys(serviceList)(theaterCounts);

  //Scales
  let x = d3.scaleLinear().range([0, chartWidth]);
  let y = d3.scaleBand().range([chartHeight, 0]);
  x.domain([0, maxVisits + 1]);
  y.domain(theaterCounts.map(d => d.key)).padding(0.1);

  //SVG Setup
  let g = svg.attr("width", width)
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
     .attr("class", d => d.key)
   .selectAll("rect")
   .data(d => d)
   .enter()
     .append("rect")
     .attr("x", d => x(d[0]))
     .attr("y", d => y(d.data.key))
     .attr("height", y.bandwidth())
     .attr("width", d => x(d[1]) - x(d[0]))
     .on("mouseout",  () => hideTooltip(tooltip))
     .on("mouseover", d => {
       let text = "<span style=\"font-weight: 900;\">" + d.data.key + ":</span> Visited " +
                  (d[1] - d[0]) + " time(s) with this service";
       updateTooltip(tooltip, d3.event.pageX, d3.event.pageY, text);
       showTooltip(tooltip);
     });
}

//Draw a chart of profits
function drawProfitGraph(data, id, service, serviceName, targetAmount, includeFees, width, height) {
  let svg = d3.select(id),
      margin = {top: 20, right: 20, bottom: 75, left: 20},
      chartWidth = width - margin.left - margin.right,
      chartHeight = height - margin.top - margin.bottom;

  let filteredData = data.filter(d => d.service === service);
  let receivedAmount = filteredData.reduce((acc, val) => Number(val.price) + acc, 0);
  let profitData = [{service: service, value: receivedAmount}];

  let adjustedTarget = includeFees ? targetAmount + filteredData.reduce((acc, val) => Number(val.fees) + acc, 0) : targetAmount;

  //Scales
  let x = d3.scaleLinear().range([0, chartWidth]);
  let y = d3.scaleBand().range([chartHeight, 0]);

  x.domain([-0.5, receivedAmount > adjustedTarget ? receivedAmount * 1.333 : adjustedTarget * 1.333]);
  y.domain([service]).padding(0.25);

  //SVG setup
  let g = svg.attr("width", width)
             .attr("height", height)
             .append("g")
             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X axis
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
        .tickSizeInner([-chartHeight])
        .ticks(1)
        .tickValues([adjustedTarget])
        .tickFormat(d => d3.format("$,.2f")(d) + " on " + serviceName + " subscription" + (includeFees ? " (including fees)" : "")));
  
  //Price bar
  g.selectAll(".bar")
      .data(profitData)
    .enter()
      .append("rect")
      .classed("bar", true)
      .classed(service, true)
      .attr("x",       0)
      .attr("height",  y.bandwidth())
      .attr("y",       d => y(d.service))
      .attr("width",   d => x(d.value));

  //Text at end of bar
  g.selectAll(".text")
    .data(profitData)
    .enter()
    .append("text")
    .attr("fill",  "#93a1a1")
      .attr("x", d => x(d.value) + 10)
      .attr("y", d => y(d.service) + (y.bandwidth() / 3))
      .attr("font-size", 12)
      .text(d => d3.format("$,.2f")(d.value) + " in tickets from " + serviceName);

  g.selectAll(".text")
    .data(profitData)
    .enter()
    .append("text")
    .attr("fill",  "#93a1a1")
      .attr("x", d => x(d.value) + 10)
      .attr("y", d => y(d.service) + (y.bandwidth() * 2.5 / 3))
      .attr("font-size", 10)
      .text(d => "(" + d3.format("$,.2f")(adjustedTarget / filteredData.length) + " per ticket)");
}



  ////////////////////////////////////////
 //      TOOLTIP/UTILITY FUNCTIONS     //
////////////////////////////////////////

function genPatternedFills(data) {
  getServiceList(data).forEach(s => {
    let fill = "<defs>" +
                 "<pattern id=\""+ s + "-stripe\" patternUnits=\"userSpaceOnUse\" width=\"5\" height=\"5\">" +
                   "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"5\" height=\"5\">" +
                     "<rect width=\"5\" height=\"5\" fill-opacity=\"0\"/>" +
                     "<path d=\"M0 5L5 0ZM6 4L4 6ZM-1 1L1 -1Z\" class=\"" + s + "-hatch\" stroke-width=\"1\"/>" +
                   "</svg>" +
                 "</pattern>" +
               "</defs>";
               
    d3.select("body")
      .append("svg")
      .attr("width",  5)
      .attr("height", 5)
      .html(fill);
  })
}

function getServiceList(data) {
  serviceList = [];
  data.forEach(d => {
    if(!serviceList.includes(d.service)) {
      serviceList.push(d.service);
    }
  })
  return serviceList;
}

function updateTooltipForMovie(tooltip, movies, xPos, yPos) {
  let movieTooltipHtml = "";

  movies.forEach( d => {
    let dateDiffMessage;
    if(!d.firstRun) {
      dateDiffMessage = "";
    } else if(d.dateDiff < -1) {
      dateDiffMessage = "<br/>(" + -d.dateDiff + " days before widest release)";
    } else if(d.dateDiff === -1) {
      dateDiffMessage = "<br/>(Thursday preview)";
    } else if(d.dateDiff === 0) {
      dateDiffMessage = "<br/>(Opening night)";
    } else {
      dateDiffMessage = "<br/>(" + d.dateDiff + " days after release)";
    }

    movieTooltipHtml +=
      "<div style=\"display:flex; flex-direction:column;margin-bottom:15px;\">" +
        "<span style=\"font-size:1.5em;text-align:center;margin-bottom:7px;\">" + d.movie + "</span>" +
        "<div style=\"display:flex\";>" +
          "<div>" +
            "<img src=\"" + d.posterUrl + "\" style=\"width:100px;margin-right:10px;\">" +
          "</div>" +
          "<div>" +
            "<span style=\"font-weight: 900;\">DATE RELEASED: </span>" + moment(d.releaseDate).format("M/D/YYYY") + "<br>" +
            "<span style=\"font-weight: 900;\">DATE WATCHED: </span>" + moment(d.date).format("M/D/YYYY") + dateDiffMessage + "<br>" +
            "<span style=\"font-weight: 900;\">THEATER: </span>" + d.theater + "<br/>" +
            (d.theaterNumber === "" ? "<br/>" : "<span style=\"font-weight: 900;\">THEATER NUMBER: </span>" + d.theaterNumber + "<br><br>") +
            "<span style=\"font-weight: 900;\">PRICE: </span>" + d3.format("$,.2f")(d.price) + "<br>" +
            "<span style=\"font-weight: 900;\">SERVICE?: </span>" + d.serviceName + "<br>" +
            "<span style=\"font-weight: 900;\">PREMIUM SCREENING?: </span>" + d.premium + "<br><br>" +
            (d.notes === "" ? "" : "<span style=\"font-weight: 900;\">NOTES: </span>" + d.notes) +
          "</div>" +
        "</div>" +
      "</div>";
  });

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
  let t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
    d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
    d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
    + "H" + w0 * cellSize + "V" + 7 * cellSize
    + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
    + "H" + (w1 + 1) * cellSize + "V" + 0
    + "H" + (w0 + 1) * cellSize + "Z";
}