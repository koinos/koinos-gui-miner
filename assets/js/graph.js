// Fake hashrate data
const data = [
  {
    time: 1,
    rate: 5,
  },
  {
    time: 2,
    rate: 12,
  },
  {
    time: 3,
    rate: 20,
  },
  {
    time: 4,
    rate: 21,
  },
  {
    time: 5,
    rate: 22,
  },
  {
    time: 6,
    rate: 23,
  },
  {
    time: 7,
    rate: 27,
  },
  {
    time: 8,
    rate: 33,
  },
  {
    time: 9,
    rate: 29,
  },
  {
    time: 10,
    rate: 50,
  },
  {
    time: 11,
    rate: 55,
  },
  {
    time: 12,
    rate: 59,
  },
  {
    time: 13,
    rate: 69,
  },
  {
    time: 14,
    rate: 50,
  },
  {
    time: 15,
    rate: 55,
  },
  {
    time: 16,
    rate: 59,
  },
  {
    time: 17,
    rate: 69,
  },
]

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("height", 300)
  .attr("width", 600)
const margin = { top: 0, bottom: 20, left: 30, right: 20 }
const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`)
const width = +svg.attr("width") - margin.left - margin.right
const height = +svg.attr("height") - margin.top - margin.bottom
const grp = chart
  .append("g")
  .attr("transform", `translate(-${margin.left},-${margin.top})`)

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
  .attr("stroke-width", 3)
  .attr("d", line)

// Add the X Axis
chart
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale).ticks(data.length))
// Add the Y Axis
chart.append("g").attr("transform", `translate(0, 0)`).call(d3.axisLeft(yScale))
