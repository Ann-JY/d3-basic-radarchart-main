import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
const attributes = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physic",
];
const radius = [0, 25, 50, 75, 100];

const svg = d3.select("#svg-container").append("svg").attr("id", "svg");

let width = parseInt(d3.select("#svg-container").style("width"));
let height = parseInt(d3.select("#svg-container").style("height"));
const margin = { top: 65, right: 50, bottom: 65, left: 50 };

// group
const g = svg
  .append("g") // group
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// scale
let minLen = d3.min([height / 2 - margin.top, width / 2 - margin.right]);
const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, minLen]);

const angleScale = d3
  .scaleLinear()
  .domain([0, attributes.length])
  .range([0, 2 * Math.PI]);

// color
const pointColor = "#5232B9";

// line radial
const radarLine = d3
  .lineRadial()
  // .curve(d3.curveLinearClosed)
  .curve(d3.curveCardinalClosed)
  .angle((d, i) => angleScale(i))
  .radius((d) => radiusScale(selectedPlayer[d]));

// svg elements
let selectedPlayer;
let selectedName = "H. Son";
let radiusAxis, angleAxis;
let path, points, labels;
let players;

////////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
let data = [];

d3.json("data/fifa23_maleplayers.json")
  .then((raw_data) => {
    data = raw_data.filter((d) => d.overall > 85);

    players = [...new Set(data.map((d) => d.short_name))];
    console.log(players);

    selectedPlayer = data.filter((d) => d.short_name === selectedName)[0];

    // Add dropdown
    const dropdown = document.getElementById("options");

    players.map((d) => {
      const option = document.createElement("option");
      option.value = d;
      option.innerHTML = d;
      option.selected = d === selectedName ? true : false;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", function () {
      selectedName = dropdown.value;
      updatePlayer();
    });

    //  line
    radarLine.radius((d) => radiusScale(selectedPlayer[d]));

    //  axis
    radiusAxis = g
      .selectAll("radius-axis")
      .data(radius)
      .enter()
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", (d) => radiusScale(d))
      .attr("fill", "rgba(10,10,10,0.01)") // 0.01
      .attr("stroke", "#c3c3c3") // #ccc
      .attr("stroke-width", 0.5);

    angleAxis = g
      .selectAll("angle-axis")
      .data(attributes)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => getXPos(100, i))
      .attr("y2", (d, i) => getYPos(100, i))
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    // path
    path = g
      .append("path")
      .datum(attributes)
      .attr("d", radarLine)
      .attr("fill", "none")
      .attr("stroke", pointColor)
      .attr("stroke-width", 1.3)
      .attr("fill", pointColor)
      .style("fill-opacity", 0.1);

    // points
    points = g
      .selectAll("points")
      .data(attributes)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => getXPos(selectedPlayer[d], i))
      .attr("cy", (d, i) => getYPos(selectedPlayer[d], i))
      .attr("r", 4.3)
      .attr("fill", pointColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.6);

    // labels
    labels = g
      .selectAll("labels")
      .data(attributes)
      .enter()
      .append("text")
      .attr("x", (d, i) => getXPos(116, i))
      .attr("y", (d, i) => getYPos(116, i) + 5)
      .text((d) => d)
      .attr("class", "labels");

    // player name
    d3.select("#player-name").text(selectedPlayer.long_name);
  })
  .catch((error) => {
    // console.error("Error loading CSV data: ", error);
  });

////////////////////////////////////////////////////////////////////
////////////////////////////  Update  //////////////////////////////
const updatePlayer = () => {
  selectedPlayer = data.filter((d) => d.short_name === selectedName)[0];

  //  line
  radarLine.radius((d) => radiusScale(selectedPlayer[d]));

  // path
  path.transition().duration(600).attr("d", radarLine);

  // points
  points
    .transition()
    .duration(600)
    .attr("cx", (d, i) => getXPos(selectedPlayer[d], i))
    .attr("cy", (d, i) => getYPos(selectedPlayer[d], i));

  // player name
  d3.select("#player-name").text(selectedPlayer.long_name);
};

////////////////////////////////////////////////////////////////////
////////////////////////////  Resize  //////////////////////////////
window.addEventListener("resize", () => {
  //  width, height updated
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));

  //  g updated
  g.attr("transform", `translate(${width / 2}, ${height / 2})`);

  //  scale updated
  minLen = d3.min([height / 2 - margin.top, width / 2 - margin.right]);
  radiusScale.range([0, minLen]);

  //  axis updated
  radiusAxis.attr("r", (d) => radiusScale(d));

  angleAxis
    .attr("x2", (d, i) => getXPos(100, i))
    .attr("y2", (d, i) => getYPos(100, i));

  //  line updated
  radarLine.radius((d) => radiusScale(selectedPlayer[d]));

  // path updated
  path.attr("d", radarLine);

  // points updated
  points
    .attr("cx", (d, i) => getXPos(selectedPlayer[d], i))
    .attr("cy", (d, i) => getYPos(selectedPlayer[d], i));

  // labels updated
  labels
    .attr("x", (d, i) => getXPos(116, i))
    .attr("y", (d, i) => getYPos(116, i) + 5);
});

////////////////// functions
const getXPos = (dist, index) => {
  return radiusScale(dist) * Math.cos(angleScale(index) - Math.PI / 2);
};

const getYPos = (dist, index) => {
  return radiusScale(dist) * Math.sin(angleScale(index) - Math.PI / 2);
};
