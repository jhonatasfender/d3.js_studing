
// Define map size on screen
var width = 960,
    height = 600;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

var zoom = d3.zoom()
		     .scaleExtent([1, 40])
		     .translateExtent([[-100, -100], [width , height]])
			 .on("zoom", zoomed);

svg.call(zoom);

// Align center of Brazil to center of map
var projection = d3.geoMercator()
  .scale(650)
  .center([-52, -15])
  .translate([width / 2, height / 2]);

var path = d3.geoPath()
  .projection(projection);



map = d3.map();
cor = d3.scaleThreshold()
	    .domain([15, 30, 45, 60, 75, 90])
	    .range(["#FFFFC1", "#FFFF4F", "#D5FF33", "#04FF04", "#08D92E", "#08A463", "#006E91"]);

d3.queue()
    .defer(d3.json, "data/municipios.json")
	.defer(d3.tsv,"data/enempardo.tsv", function(d) {
		//console.log(d); 
		map.set(d.municipio, d.percentual); 
	})
    .await(ready);

function ready(error, shp) {
  if (error) throw error;

  // Extracting polygons and contours
  /*var states = topojson.feature(shp, shp.objects.municipios);
  var states_contour = topojson.mesh(shp, shp.objects.municipios);

  // Desenhando estados
  g.selectAll(".estado")
      .data(states.features)
    .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path);

  g.append("path")
    .datum(states_contour)
    .attr("d", path)
    .attr("class", "state_contour");*/
    g.selectAll(".municipios")
		.data(topojson.feature(shp,shp.objects.municipios).features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("fill", function(d) { 
			var n = d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome.toUpperCase(),r = cor(map.get(n));
			return r == undefined ? '#FFFFFF' : r;
		})
		.attr('class','state');

	g.append("path")
		.datum(topojson.mesh(shp,shp.objects.municipios))
		.attr("d", path)
		.attr("stroke-width",1)
		.attr("class", "state_contour")
		.on("mousemove",function(e){
			//console.log(e);
		});
}

// What to do when zooming
function zoomed() {
	g.attr("transform", d3.event.transform);
}
