
var n = 40,
  random = d3.randomNormal(0, .2),
  data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,]
var svg = d3.select("#chart"),
  margin = { top: 100, right: 100, bottom: 20, left: 40 },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom,
  g = svg.append("g").attr("transform", "translate(" + 10 + "," + 0 + ")");

var x = d3.scaleLinear()
  .domain([0, n])
  .range([0, 800]);

var y = d3.scaleLinear()
  .domain([0, 100])
  .range([100, 0]);

var line = d3.line()
  .x(function (d, i) { return x(i); })
  .y(function (d, i) { return y(d); });

g.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

g.append("g")
  .attr("class", "axis axis--x")
  .attr("transform", "translate(0," + y(0) + ")")
  .call(d3.axisBottom(x));

g.append("g")
  .attr("class", "axis axis--y")
  .call(d3.axisLeft(y));

g.append("g")
  .attr("clip-path", "url(#clip)")
  .append("path")
  .datum(data)
  .attr("class", "line")
  .transition()
  .duration(2000)
  .attr("stroke", "yellow")
  .ease(d3.easeLinear)
  .on("start", tick);

function tick() {
  // Push a new data point onto the back.

  if (currentHashrate !== null) {
    data.push(currentHashrate);
  }

  if (hashrateLow !== null && hashrateHigh !== null) {
    var x2 = d3.scaleLinear()
      .domain([0, 40])
      .range([0, 800]);

    var y2 = d3.scaleLinear()
      .domain([hashrateLow, hashrateHigh])
      .range([100, 0]);

    var line2 = d3.line()
      .x(function (d, i) { return x2(i); })
      .y(function (d, i) { return y2(d); });

    // Redraw the line.
    d3.select(this)
      .attr("d", line2)
      .attr("transform", null);
  }

  // Slide it to the left.
  d3.active(this)
    .attr("transform", "translate(" + x(-1) + ",0)")
    .transition()
    .on("start", tick);

  // Pop the old data point off the front.
  data.shift();
}

