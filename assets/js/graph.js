// Fake hashrate data
const data = [
  {
    time: 1,
    rate: 5,
  },
  {
    time: 2,
    rate: 6,
  },
  {
    time: 3,
    rate: 8,
  },
  {
    time: 4,
    rate: 10,
  },
  {
    time: 5,
    rate: 10,
  },
  {
    time: 6,
    rate: 12,
  },
  {
    time: 7,
    rate: 11,
  },
  {
    time: 8,
    rate: 12,
  },
  {
    time: 9,
    rate: 13,
  },
  {
    time: 10,
    rate: 15,
  },
  {
    time: 11,
    rate: 16,
  },
  {
    time: 12,
    rate: 15,
  },
  {
    time: 13,
    rate: 29,
  },
  {
    time: 14,
    rate: 30,
  },
  {
    time: 15,
    rate: 31,
  },
  {
    time: 16,
    rate: 29,
  },
  {
    time: 17,
    rate: 31,
  },
]

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("height", 200)
  .attr("width", 600)
const margin = { top: 0, bottom: 20, left: 30, right: 20 }
const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`)
const width = +svg.attr("width") - margin.left - margin.right
const height = +svg.attr("height") - margin.top - margin.bottom
const grp = chart
  .append("g")
  .attr("transform", `translate(-${margin.left},-${margin.top})`)

var defs = svg.append("defs")

var gradient = defs
  .append("linearGradient")
  .attr("id", "svgGradient")
  .attr("x1", "0%")
  .attr("x2", "100%")
  .attr("y1", "0%")
  .attr("y2", "100%")

gradient
  .append("stop")
  .attr("class", "start")
  .attr("offset", "0%")
  .attr("stop-color", "#6F00F6")
  .attr("stop-opacity", 0.4)

gradient
  .append("stop")
  .attr("class", "end")
  .attr("offset", "100%")
  .attr("stop-color", "red")
  .attr("stop-opacity", 1)

const yScale = d3
  .scaleLinear()
  .range([height, 0])
  .domain([0, d3.max(data, (dataPoint) => dataPoint.rate)])
const xScale = d3
  .scaleLinear()
  .range([0, width])
  .domain(d3.extent(data, (dataPoint) => dataPoint.time))

const line = d3
  .line()
  .x((dataPoint) => xScale(dataPoint.time))
  .y((dataPoint) => yScale(dataPoint.rate))

grp
  .append("path")
  .attr("transform", `translate(${margin.left},0)`)
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-linejoin", "round")
  .attr("stroke-linecap", "round")
  .attr("stroke-width", 2)
  .attr("d", line)
  .attr("stroke", "url(#svgGradient)")
  .attr("fill", "none")

chart
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale).ticks(data.length))

chart.append("g").attr("transform", `translate(0, 0)`).call(d3.axisLeft(yScale))
