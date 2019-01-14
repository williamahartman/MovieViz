//Load data from spreadsheet and draw graphs
const public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1Ex4A6yFXT0QUCWTioNcop896I6CWirV6ZZ3-H6UPvig/edit?usp=sharing";
Tabletop.init({ key: public_spreadsheet_url,
                callback: drawGraphs,
                wanted: ["Movies", "Memberships"]});
            
function drawGraphs(spreadsheetContents, tabletop) {
  // Define the div for the tooltip
  const tooltipDiv = d3.select("body")
                       .append("div")
                       .attr("class", "tooltip")
                       .style("opacity", 0);

  //get the data we need
  var data = spreadsheetContents["Movies"].elements;
  var membershipData = spreadsheetContents["Memberships"].elements;

  //Clean up data
  data = data.map(d => {
    d.releaseDate = moment(d.releaseDate, "MM/DD/YYYY")
    d.dateDiff = moment(d.viewDate, "MM/DD/YYYY").diff(d.releaseDate, "days");
    d.viewDate = moment(d.viewDate + " " + d.time, "MM/DD/YYYY h:mm:ss a");
    d.isTimeSet = d.time !== "";
    d.firstRun = d.firstRun === "Yes";
    d.isPremium = d.format !== "DCP" && d.format !== "35mm";
    d.serviceName = d.service;
    d.service = "service-" + d.service.toLowerCase().replace(" ", "-")
    d.price = +d.price;
    d.fees = +d.fees;
    d.rating = +d.rating;
    return d;
  });
  membershipData = membershipData.map(s => {
    s.serviceNameSimple = s.service;
    s.service = "service-" + s.serviceNameSimple.toLowerCase().replace(" ", "-");
    s.legendText = s.legendText;
    s.showInLegend = s.showInLegend === "TRUE";
    s.showProfitGraph = s.showProfitGraph === "TRUE";
    s.allowsPremium = s.allowsPremium === "TRUE";
    s.isActive = s.isActive === "TRUE";
    s.textStatDescription = s.textStatDescription;
    s.textStatUnitSingle = s.textStatUnitSingle;
    s.textStatUnitPlural = s.textStatUnitPlural;
    s.color = s.color;
    s.perMonth = +s.perMonth;
    s.numMonths = +s.numMonths;
    s.perYear = +s.perYear;
    s.numYears = +s.numYears;
    s.discounts = +s.discounts;
    s.serviceFees = +s.serviceFees;
    s.movieCosts = +s.movieCosts;
    s.movieFees = +s.movieFees;
    return s;
  });
  console.log(data);
  console.log(membershipData);

  //Generate the hatched patterned fills for each service
  genPatternedFillsAndStyles(membershipData);

  //Figure out year range
  const firstYear = d3.min(data, d => moment(d.viewDate).year());
  const lastYear =  d3.max(data, d => moment(d.viewDate).year());

  //Draw Legends
  drawLegends(membershipData, "#legend")

  //Draw Charts
  drawTextStats(data, membershipData, firstYear, "#text-stats");
  drawRatingsGraph(data, "#ratings-graph", 885, tooltipDiv);
  drawCalendarChart(data, "#calendar-graph", d3.range(firstYear, lastYear + 1), 885, 136, 15, tooltipDiv);
  drawDayOfWeekGraph(data, "#day-of-week-graph", 885, tooltipDiv);
  drawShowTimeGraph(data, "#show-time-graph", 885, tooltipDiv);
  drawDateDiffBarGraph(data, "#date-diff-graph", 885, tooltipDiv);
  drawTheaterGraph(data, "#theater-graph", 885, tooltipDiv);
  drawAllProfitGraphs(data, membershipData, "#profit-charts", tooltipDiv);
}

//Draw a coarse summary of some basic statistics
function drawTextStats(data, membershipData, startYear, id) {
  var statsTable =  "<div style=\"display:flex;flex-wrap:wrap;\">";
  membershipData.forEach(m => {
    const numFromService = data.filter(d => d.service === m.service).length;
    statsTable += 
      "<div style=\"width:33%\">" +
        "<table>" +
          "<tbody>" +
            "<tr>" +
              "<td class=\"" + m.service + "\" style=\"font-size:25px;text-align:right;50px;\">" + numFromService + "</td>" +
              "<td style=\"padding:10px;\">" + (numFromService === 1 ? m.textStatUnitSingle : m.textStatUnitPlural) + " " + m.textStatDescription + "</td>" +
            "</tr>" +
          "</tbody>" +
        "</table>" +
      "</div>";
  });
  statsTable += "</div>";

  const numMoviesTotal = data.length;
  const numMoviesThisYear = data.filter(d => d.viewDate.year() == moment().year()).length;
  d3.select(id)
    .append("div")
    .html(
      "<table width=100%>" + 
        "<tr>" + 
          "<td style=\"color:#fdf6e3;font-size:30px;text-align:right;padding-bottom:30px;width:50px;\">" + numMoviesThisYear + "</td>" +
          "<td style=\"font-size:20px;padding-left:15px;padding-bottom:30px\">" + (numMoviesThisYear == 1 ? "movie" : "movies") + " in theaters this year (so far...)</td>" +
          "<td style=\"color:#fdf6e3;font-size:30px;text-align:right;padding-bottom:30px;width:50px;\">" + numMoviesTotal + "</td>" +
          "<td style=\"font-size:20px;padding-left:15px;padding-bottom:30px\">" + (numMoviesTotal == 1 ? "movie" : "movies") + " in theaters since 1/1/" + startYear + "</td>" +
        "</tr>" + 
        "<tr>" + 
          
        "</tr>" + 
      "</table>" +
      statsTable
    );
}

//Draw a legend for service colors
function drawLegends(membershipData, id) {
  var legend =  "<div style=\"display:flex;flex-wrap:wrap;width:70%;margin:auto;margin-bottom:15px;\">";
  membershipData.filter(m => m.showInLegend)
                .forEach(m => {
                  legend += 
                    "<div style=\"width:33%;margin-bottom:-5px;\">" +
                      "<table>" +
                        "<tbody>" +
                          "<tr>" +
                            "<td class=\"" + m.service + "\" style=\"text-align:right;font-size:1.5em\">■</td>" +
                            "<td style=\"padding-left:5px;padding-right:5px;font-size:0.75em\">" + m.legendText + "</td>" +
                          "</tr>" +
                        "</tbody>" +
                      "</table>" +
                    "</div>";
                });
  legend += "</div>";

  d3.selectAll(id)
    .append("div")
    .html(legend);
}

//Draw a graph of ratings
function drawRatingsGraph(data, id, width, tooltip) {
  //Data processing
  const serviceList = getServiceList(data);
  serviceList.sort((a, b) => data.filter(d => b === d.service).length - data.filter(d => a === d.service).length);
  const ratingsList = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const filteredData = [];
  data.sort((a, b) => a.viewDate - b.viewDate);
  data.forEach((d) => {
    const inData = filteredData.some(d2 => d2.movie === d.movie);
    if(!inData && d.rating != 0) {
      filteredData.push(d);
    }
  });

  filteredData.sort((a, b) => {
    const aToNum = (10 * serviceList.findIndex(d => d === a.service)); 
    const bToNum = (10 * serviceList.findIndex(d => d === b.service));
    return aToNum - bToNum;
  });

  const ratingsTally = []
  ratingsList.forEach(() => ratingsTally.push(0));
  filteredData.forEach(d => {
    const serviceIndex = ratingsList.findIndex(t => t === d.rating);
    d.ratingsGraphPos = ratingsTally[serviceIndex];
    ratingsTally[serviceIndex]++;
  })
  const maxRatings = d3.max(ratingsTally);

  //Svg junk
  const svg = d3.select(id),
      calculatedHeight = maxRatings * 9,
      margin = {top: 20, right: 225, bottom: 30, left: 225},
      chartWidth = width - margin.left - margin.right,
      height = calculatedHeight + margin.top + margin.bottom;

  //Scales
  const x = d3.scaleBand().range([chartWidth, 0]);
  const y = d3.scaleLinear().range([0, calculatedHeight]);
  x.domain(ratingsList.reverse()).padding(0.025);
  y.domain([0, maxRatings]);

  //SVG Setup
  const g = svg.attr("width",  "100%")
               .attr("viewBox", "0 0 " + width + " " + height)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  //X-axis
  g.append("g")
   .attr("class", "xaxis")
   .attr("transform", "translate(0," + calculatedHeight + ")")
   .call(d3.axisBottom(x)
           .tickFormat(d => numToStars(d)));

  //Stacked bars
  g.selectAll(".bar")
    .data(filteredData)
   .enter()
     .append("rect")
     .attr("fill", d => "url(#" + d.service + "-stripe)")
     .attr("class", "bar")
     .attr("class", d => d.isPremium ? "" : d.service)
     .attr("y", d => calculatedHeight - y(d.ratingsGraphPos + 1))
     .attr("x", d => x(d.rating))
     .attr("width", x.bandwidth())
     .attr("height", () => y(1) - 0.5)
     .on("mouseout",  () => hideTooltip(tooltip))
     .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
     .on("mouseover", d => {
       updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
       showTooltip(tooltip);
     });
}

//Draw a graph of day-of-the-week frequencies
function drawDayOfWeekGraph(data, id, width, tooltip) {
  //Data processing
  const serviceList = getServiceList(data);
  serviceList.sort((a, b) => data.filter(d => b === d.service).length - data.filter(d => a === d.service).length);
  const dayList = [0, 1, 2, 3, 4, 5, 6];

  const filteredData = data.filter(d => d.viewDate.isValid());
  filteredData.sort((a, b) => {
    const aToNum = (10 * serviceList.findIndex(d => d === a.service)); 
    const bToNum = (10 * serviceList.findIndex(d => d === b.service));
    return aToNum - bToNum;
  });

  const dayTally = []
  dayList.forEach(() => dayTally.push(0));
  filteredData.forEach(d => {
    d.dayGraphPos = dayTally[d.viewDate.day()];
    dayTally[d.viewDate.day()]++;
  })
  const maxDayNum = d3.max(dayTally);

  //Svg junk
  const svg = d3.select(id),
      calculatedHeight = maxDayNum * 9,
      margin = {top: 20, right: 250, bottom: 30, left: 250},
      chartWidth = width - margin.left - margin.right,
      height = calculatedHeight + margin.top + margin.bottom;

  //Scales
  const x = d3.scaleBand().range([chartWidth, 0]);
  const y = d3.scaleLinear().range([0, calculatedHeight]);
  x.domain(dayList.reverse()).padding(0.25);
  y.domain([0, maxDayNum]);

  //SVG Setup
  const g = svg.attr("width",  "100%")
               .attr("viewBox", "0 0 " + width + " " + height)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  //X-axis
  g.append("g")
   .attr("class", "xaxis")
   .attr("transform", "translate(0," + calculatedHeight + ")")
   .call(d3.axisBottom(x)
           .tickFormat(d => ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"][d]));

  //Stacked bars
  g.selectAll(".bar")
    .data(filteredData)
   .enter()
     .append("rect")
     .attr("fill", d => "url(#" + d.service + "-stripe)")
     .attr("class", "bar")
     .attr("class", d => d.isPremium ? "" : d.service)
     .attr("y", d => calculatedHeight - y(d.dayGraphPos + 1))
     .attr("x", d => x(d.viewDate.day()))
     .attr("width", x.bandwidth())
     .attr("height", () => y(1) - 0.5)
     .on("mouseout",  () => hideTooltip(tooltip))
     .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
     .on("mouseover", d => {
       updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
       showTooltip(tooltip);
     });
}

//Draw a graph of show times
function drawShowTimeGraph(data, id, width, tooltip) {
  //Data processing
  const serviceList = getServiceList(data);
  serviceList.sort((a, b) => data.filter(d => b === d.service).length - data.filter(d => a === d.service).length);

  var filteredData = data.filter(d => d.isTimeSet)
                          .map(d => {
                                  var hours = d.viewDate.hour();
                                  var minutes = d.viewDate.minute();
                                  d.viewTime = (hours * 60) + minutes;
                                  return d;
                                });
  var hist = d3.histogram()
               .value((d) => d.viewTime)
               .domain([0, 60 * 24])
               .thresholds(Array.from({length: 48}, (v, k) => k * 30))
               (filteredData);

  hist.forEach(bin => {
    for(i = 0; i < bin.length; i++) {
      bin[i].showtimeGraphPos = i;
      bin[i].x0 = bin.x0;
      bin[i].x1 = bin.x1;
    }
  });
  const maxShowtimeBarHeight =  d3.max(filteredData, d => d.showtimeGraphPos);

  //Svg junk
  const svg = d3.select(id),
      calculatedHeight = 9 * maxShowtimeBarHeight;
      margin = {top: 20, right: 50, bottom: 30, left: 50},
      chartWidth = width - margin.left - margin.right,
      height = calculatedHeight + margin.top + margin.bottom;

  //Scales
  const x = d3.scaleLinear().domain([0, 60 * 24]).range([0, chartWidth]);
  const y = d3.scaleLinear().domain([0, maxShowtimeBarHeight]).range([0, calculatedHeight]);

  //SVG Setup
  const g = svg.attr("width",  "100%")
                .attr("viewBox", "0 0 " + width + " " + height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  //X-axis
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + calculatedHeight + ")")
      .call(d3.axisBottom(x)
              .tickSizeInner([10])
              .tickValues(Array.from({length: 13}, (v, k) => k * 120))
              .tickFormat(d => {
                var hour = Math.floor(d / 60);
                var minute = d % 60;
                var ampm = hour >= 12 ? "PM" : "AM";
                hour = hour == 0 ? 12 : hour;
                return (hour <= 12 ? hour : hour - 12) + ":" + d3.format("02")(minute) + " " + ampm;
              }));

  //Stacked bars
  g.selectAll(".bar")
      .data(filteredData)
    .enter()
      .append("rect")
      .attr("fill", d => "url(#" + d.service + "-stripe)")
      .attr("class", "bar")
      .attr("class", d => d.isPremium ? "" : d.service)
      .attr("y", d => calculatedHeight - y(d.showtimeGraphPos + 1))
      .attr("x", d => x(d.x0))
      .attr("width", d => x(d.x1) - x(d.x0) - 1)
      .attr("height", () => y(1) - 0.5)
      .on("mouseout",  () => hideTooltip(tooltip))
      .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });
}

//Draw a calendar chart with movies on it.
function drawCalendarChart(data, id, yearRange, width, height, cellSize, tooltip) {
  const countDay = d => d.getDay(),
        formatDay = d => "SMTWRFS"[d.getDay()],
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const filteredData = data.filter(d => d.viewDate.isValid());

  //SVG for the chart
  const svg = d3.select(id)
              .attr("class",  "calendar-chart")
              .selectAll("svg")
              .data(yearRange)
              .enter()
                .append("svg")
                .attr("width",  "100%")
                .attr("viewBox", "0 0 " + width + " " + height)
                .append("g")
                .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

  // Days
  const rect = svg.append("g")
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
  filteredData.forEach(datum => {
    let sameDayMovies = filteredData.filter(d => moment(d.viewDate).isSame(datum.viewDate, "day"));
    rect.filter(d => moment(datum.viewDate).isSame(d, "day"))
        .classed(datum.service, !datum.isPremium)
        .attr("fill", () => "url(#" + datum.service + "-stripe)")
        .on("mouseout",  () => hideTooltip(tooltip))
        .on("mousemove", d => updateTooltipForMovie(tooltip, sameDayMovies, d3.event.pageX, d3.event.pageY))
        .on("mouseover", d => {
          updateTooltipForMovie(tooltip, sameDayMovies, d3.event.pageX, d3.event.pageY);
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
         let numMovies = filteredData.filter(datum => moment(datum.viewDate).isSame(d, "day")).length;
         return numMovies > 1 ? numMovies : "";
       });

}

//Draw a chart of movie date distances
function drawDateDiffBarGraph(data, id, width, tooltip) {
  //Sort and filter data, find min/max
  data.sort((a, b) => b.dateDiff - a.dateDiff);
  const filteredData = data.filter(d => d.firstRun)
                           .filter(d => d.releaseDate.isValid())
                           .map(d => {
                             d.movieGraph = d.movie.length > 25 ? d.movie.substring(0, 25)+"..." : d.movie;
                             return d;
                           });
  const minDiff = d3.min(filteredData, d => d.dateDiff);
  const maxDiff = d3.max(filteredData, d => d.dateDiff);

  //SVG junk
  const svg = d3.select(id),
  calculatedHeight = filteredData.length * 8.5,
  margin = {top: 20, right: 20, bottom: 30, left: 150},
  chartWidth = width - margin.left - margin.right,
  height = calculatedHeight + margin.top + margin.bottom;
    
  //Scales
  const x = d3.scaleLinear().range([0, chartWidth]);
  const y = d3.scaleBand().range([calculatedHeight, 0]);
  x.domain([minDiff, maxDiff + 5]);
  y.domain(filteredData.map(d => d.movieGraph)).padding(0.1);

  //SVG setup
  const g = svg.attr("width",  "100%")
               .attr("viewBox", "0 0 " + width + " " + height)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X-axis
  const ticks = [];
  let i = 0;
  for(i = minDiff; i <= maxDiff + 5; i++) {
    if(i % 7 == 0) {
      ticks.push(i);
    }
  }
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + calculatedHeight + ")")
      .call(d3.axisBottom(x)
              .tickSizeInner([-calculatedHeight])
              .tickValues(ticks));

  //Y-axis
  g.append("g")
      .attr("class", "yaxis")
      .call(d3.axisLeft(y));
  
  //Date diff bars
  const moviesAdded = []
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
      .attr("x",  d => d.dateDiff > 0 ? x(0) : d.dateDiff === 0 ? x(0) - 2 : x(d.dateDiff))
      .attr("height",  y.bandwidth())
      .attr("y",       d => y(d.movieGraph))
      .attr("width",   d => { 
        return d.dateDiff == 0 ? 4 : Math.abs(x(d.dateDiff) - x(0)); 
      })
      .on("mouseout",  () => hideTooltip(tooltip))
      .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });
}

//Draw a graph of theater counts
function drawTheaterGraph(data, id, width, tooltip) {
  //Data processing
  const filteredData = data.filter(d => d.theater !== "")
                           .filter(d => d.service !== "");
  const serviceList = getServiceList(filteredData);
  serviceList.sort((a, b) => filteredData.filter(d => b === d.service).length - filteredData.filter(d => a === d.service).length);
  const theaterList = getTheaterList(filteredData)
                        .sort((a, b) => filteredData.filter(d => b === d.theater).length - filteredData.filter(d => a === d.theater).length);
                        filteredData.sort((a, b) => {
    const aToNum = (1000000000 * serviceList.findIndex(d => d === a.service)) + (moment(a.viewDate).unix()); 
    const bToNum = (1000000000 * serviceList.findIndex(d => d === b.service)) + (moment(b.viewDate).unix());
    return aToNum - bToNum;
  });
  const theaterTally = []
  theaterList.forEach(() => theaterTally.push(0));
  filteredData.forEach(d => {
    const serviceIndex = theaterList.findIndex(t => t === d.theater);
    d.theaterGraphPos = theaterTally[serviceIndex];
    theaterTally[serviceIndex]++;
  })
  const maxVisits = d3.max(theaterTally);

  //Svg junk
  const svg = d3.select(id),
      calculatedHeight = theaterList.length * 10,
      margin = {top: 20, right: 20, bottom: 30, left: 185},
      chartWidth = width - margin.left - margin.right,
      height = calculatedHeight + margin.top + margin.bottom

  //Scales
  const x = d3.scaleLinear().range([0, chartWidth]);
  const y = d3.scaleBand().range([calculatedHeight, 0]);
  x.domain([0, maxVisits + 1]);
  y.domain(theaterList).padding(0.1);

  //SVG Setup
  const g = svg.attr("width",  "100%")
               .attr("viewBox", "0 0 " + width + " " + height)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  //X-axis
  g.append("g")
   .attr("class", "xaxis")
   .attr("transform", "translate(0," + calculatedHeight + ")")
   .call(d3.axisBottom(x)
           .ticks(maxVisits)
           .tickSizeInner([-calculatedHeight]));

  //Y-axis
  g.append("g")
   .attr("class", "yaxis")
   .call(d3.axisLeft(y));

  //Stacked bars
  g.selectAll(".bar")
    .data(filteredData)
   .enter()
     .append("rect")
     .attr("fill", d => "url(#" + d.service + "-stripe)")
     .attr("class", "bar")
     .attr("class", d => d.isPremium ? "" : d.service)
     .attr("x", d => x(d.theaterGraphPos) + 0.25)
     .attr("y", d => y(d.theater))
     .attr("height", y.bandwidth())
     .attr("width", () => x(1) - 0.5)
     .on("mouseout",  () => hideTooltip(tooltip))
     .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
     .on("mouseover", d => {
       updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
       showTooltip(tooltip);
     });
}

//Add divs and draw all the requested profit charts
function drawAllProfitGraphs(data, membershipData, id, tooltip) {
  var profitGraphsDiv = d3.select(id);

  membershipData.filter(s => s.showProfitGraph)
                .sort((s1, s2) => s2.isActive - s1.isActive)
                .forEach(s => {
                  profitGraphsDiv.append("div")
                    .attr("class", "section")
                    .attr("id", s.service + "-profit-graph-section")
                    .append("h2")
                    .text(s.serviceNameSimple + " Profitability");

                  d3.select("#" + s.service + "-profit-graph-section")
                    .append("svg")
                    .attr("id", s.service + "-profit-graph");

                  var caption = "";
                  caption += s.serviceNameSimple + " becomes profitable after the bar clears the hatched background.";
                  caption += s.allowsPremium ? " Premium showings have hatched bars." : "";

                  d3.select("#" + s.service + "-profit-graph-section")
                    .append("p")
                    .attr("class", "chart-caption")
                    .text(caption);

                  drawProfitGraph(data, "#" + s.service + "-profit-graph", s.service, s.serviceNameSimple, s.totalSpent, s.movieFees > 0, 885, 130, tooltip)
                });
}

//Draw a chart of profits
function drawProfitGraph(data, id, service, serviceName, targetAmount, includeFees, width, height, tooltip) {
  const svg = d3.select(id),
        margin = {top: 20, right: 20, bottom: 35, left: 20},
        chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom;

  //Data Processing
  const filteredData = data.filter(d => d.service === service)
                           .filter(d => d.viewDate.isValid());
  filteredData.sort((a, b) => moment(a.viewDate).unix() - moment(b.viewDate).unix())

  var receivedAmount = 0;
  filteredData.forEach(d => {
    d.profitGraphPos = receivedAmount;
    receivedAmount += d.price;
  });
  const profitData = [{service: service, value: receivedAmount}];

  //Scales
  const x = d3.scaleLinear().range([0, chartWidth]);
  const y = d3.scaleBand().range([chartHeight, 0]);
  x.domain([0, receivedAmount > targetAmount ? receivedAmount * 1.333 : targetAmount * 1.333]);
  y.domain([service]).padding(0.25);

  //SVG setup
  const g = svg.attr("width",  "100%")
               .attr("viewBox", "0 0 " + width + " " + height)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //X axis
  g.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(d3.axisBottom(x)
        .tickSizeInner([10])
        .ticks(1)
        .tickValues([targetAmount])
        .tickFormat(d => d3.format("$,.2f")(d) + " on " + serviceName + " subscription" + (includeFees ? " (including fees)" : "")));
  
  //Hatched background
  g.selectAll(".bar")
      .data(profitData)
    .enter()
      .append("rect")
      .attr("fill",   () => "url(#background-stripe)")
      .attr("x",      () => x(0))
      .attr("y",      d => y(0))
      .attr("height", chartHeight)
      .attr("width",  d => x(targetAmount));

  //Price bars
  g.selectAll(".bar")
      .data(filteredData)
    .enter()
      .append("rect")
      .attr("fill", d => "url(#" + d.service + "-stripe)")
      .attr("class", "bar")
      .attr("class",   d => d.isPremium ? "" : d.service)
      .attr("x",       d => x(d.profitGraphPos))
      .attr("height",  y.bandwidth())
      .attr("y",       d => y(d.service))
      .attr("width",   d => x(d.price) - 0.5)
      .on("mouseout",  () => hideTooltip(tooltip))
      .on("mousemove", d => updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY))
      .on("mouseover", d => {
        updateTooltipForMovie(tooltip, [d], d3.event.pageX, d3.event.pageY);
        showTooltip(tooltip);
      });

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
      .text(d => "(" + d3.format("$,.2f")(targetAmount / filteredData.length) + " per ticket)");
}



  ////////////////////////////////////////
 //      TOOLTIP/UTILITY FUNCTIONS     //
////////////////////////////////////////

function genPatternedFillsAndStyles(membershipData) {
  var sheet = window.document.styleSheets[1];
  membershipData.forEach(s => {
    var colorRule = "." + s.service + " {" +
                      "fill: "  + s.color + ";" +
                      "color: " + s.color + ";" +
                    "}"
    var hatchRule = "." + s.service + "-hatch {" +
                      "stroke: "  + s.color + ";" +
                    "}"

    sheet.insertRule(colorRule, sheet.cssRules.length);
    sheet.insertRule(hatchRule, sheet.cssRules.length);
  })

  //Add patterned fills for each service
  membershipData.map(s => s.service)
                .forEach(s => {
                  const fill = 
                    "<defs>" +
                      "<pattern id=\""+ s + "-stripe\" patternUnits=\"userSpaceOnUse\" width=\"5\" height=\"5\">" +
                        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"5\" height=\"5\">" +
                          "<rect width=\"5\" height=\"5\" fill-opacity=\"0\"/>" +
                          "<path d=\"M0 5L5 0ZM6 4L4 6ZM-1 1L1 -1Z\" class=\"" + s + "-hatch\" stroke-width=\"2\"/>" +
                        "</svg>" +
                      "</pattern>" +
                    "</defs>";
                  d3.select("body")
                    .append("svg")
                    .attr("width",  5)
                    .attr("height", 5)
                    .html(fill);
                });
}

function getServiceList(data) {
  const serviceList = [];
  data.forEach(d => {
    if(!serviceList.includes(d.service)) {
      serviceList.push(d.service);
    }
  })
  return serviceList;
}

function getTheaterList(data) {
  const theaterList = [];
  data.forEach(d => {
    if(!theaterList.includes(d.theater)) {
      theaterList.push(d.theater);
    }
  })
  return theaterList;
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
    } else if(d.dateDiff > 0) {
      dateDiffMessage = "<br/>(" + d.dateDiff + " days after release)";
    } else if(isNaN(d.dateDiff)){
      dateDiffMessage = "<br/>(??? days after release)";;
    }

    movieTooltipHtml +=
      "<div style=\"display:flex; flex-direction:column;margin-bottom:15px;\">" +
        "<span style=\"font-size:1.5em;text-align:center;margin-bottom:7px;\">" + 
          d.movie + 
          "<br>" +
          numToStars(d.rating) +
        "</span>" +
        "<div style=\"display:flex\";>" +
          "<div>" +
            "<img src=\"" + (d.posterUrl === "" ? "placeholderposter.png" : d.posterUrl) + "\" style=\"width:100px;margin-right:10px;\">" +
          "</div>" +
          "<div>" +
            "<span style=\"font-weight: 900;\">DATE RELEASED: </span>" + (d.releaseDate.isValid() ? moment(d.releaseDate).format("M/D/YYYY") : "???") + "<br>" +
            "<span style=\"font-weight: 900;\">DATE WATCHED: </span>" + moment(d.viewDate).format("M/D/YYYY") + dateDiffMessage + "<br>" +
            (d.isTimeSet ? "<span style=\"font-weight: 900;\">SHOW TIME: </span>" + moment(d.viewDate).format("h:mm A") + "<br>" : "") +
            "<span style=\"font-weight: 900;\">THEATER: </span>" + d.theater + "<br/>" +
            (d.theaterNumber === "" ? "<br/>" : "<span style=\"font-weight: 900;\">THEATER NUMBER: </span>" + d.theaterNumber + "<br><br>") +
            "<span style=\"font-weight: 900;\">PRICE: </span>" + d3.format("$,.2f")(d.price) + "<br>" +
            (d.fees === 0 ? "" : "<span style=\"font-weight: 900;\">FEES: </span>" + d3.format("$,.2f")(d.fees) + "<br>") +
            "<span style=\"font-weight: 900;\">SERVICE?: </span>" + d.serviceName + "<br>" +
            "<span style=\"font-weight: 900;\">FORMAT: </span>" + d.format + "<br><br>" +
            (d.notes === "" ? "" : "<span style=\"font-weight: 900;\">NOTES: </span>" + d.notes) +
          "</div>" +
        "</div>" +
      "</div>";
  });

  updateTooltip(tooltip, xPos, yPos, movieTooltipHtml);
}

function numToStars(rating) {
  let starStr = "";

  while(rating >= 1) {
    starStr += "★";
    rating--;
  }

  if(rating > 0) {
    starStr += "½";
  }

  return starStr;
}

function updateTooltip(tooltip, xPos, yPos, toolTipHtml) {
  tooltip.html(toolTipHtml);

  const tooltipWidth =   tooltip.node().clientWidth;
  const tooltipHeight =  tooltip.node().clientHeight;
  const documentWidth =  document.documentElement.scrollWidth;
  const documentHeight = window.scrollY + window.innerHeight;

  var xPosCorrected = xPos;
  if(xPos + tooltipWidth > documentWidth) {
    xPosCorrected = documentWidth - tooltipWidth
  }
  var yPosCorrected = yPos;
  if(yPos + tooltipHeight > documentHeight) {
    yPosCorrected = documentHeight - tooltipHeight;
  }

  tooltip.style("left", xPosCorrected + "px")
         .style("top",  yPosCorrected + "px");
}

function showTooltip(tooltip) {
  tooltip.transition()
         .duration(200)
         .style("opacity", .95);
}

function hideTooltip(tooltip) {
  tooltip.transition()
         .duration(200)
         .style("opacity", 0);
}

function pathMonth(t0, cellSize) {
  const t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), 
        w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
        d1 = t1.getDay(), 
        w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
    + "H" + w0 * cellSize + "V" + 7 * cellSize
    + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
    + "H" + (w1 + 1) * cellSize + "V" + 0
    + "H" + (w0 + 1) * cellSize + "Z";
}