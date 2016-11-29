
// Define map size on screen
(function(w){
	var form = {
		f: function() {
		 	var select = document.getElementById("estados");
			u.load("topo/" + select.value.toLowerCase() + ".json",true);
		 },
		main: function (){
		 	var body = d3.select("body");
		 	var div = body.append('div').attr('class', 'mapas');
		 	var filtro = div.append('div').attr('class', 'filtros-mapa col-md-3 col-sm-4 col-xs-7');
		 	var span = filtro.append('span').attr('class', 'instrucao').text('PAINEL DE CONTROLE');
		 	var a = filtro.append('a');
		 	var i = a.append('i').attr('class', 'close fa fa-times');
		 	var divFormGroup = filtro.append('div').attr('class', 'form-group');
		 	var label = divFormGroup.append('label').attr('class', 'amarelo').text('Selecione UF:');
		 	var select = divFormGroup.append('select').attr('id', 'estados').attr('class', 'selectpicker form-control');
		 	for (var j = 0; j < u.ufs.length; j++) 
		 		select.append('option').attr('value', u.ufs[j]).text(u.ufs[j]);
		 	var button = filtro.append('button').attr('class', 'btn btn-primary btn-lg btn-block btn-mapa').text('OK')
		 	.on('click', form.f);
		}
	},
	u = {
		ufs: ["Todos","AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"],
		g: null,path: null, map: null, cor: null,
		getScreenSize: function (){
		    var d = document,
		    e = d.documentElement,
		    g = d.getElementsByTagName('body')[0],
		    x = w.innerWidth || e.clientWidth || g.clientWidth,
		    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

		    return {x: x, y: y};
		},
		ready: function(error,shp){
			if (error) throw error;
			for (var j in shp.objects) {
				u.g.selectAll("." + j)
					.data(topojson.feature(shp,shp.objects[j]).features)
					.enter()
					.append("path")
					.attr("fill", function(d) { 
						var n = d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome.toUpperCase(),r = u.cor(u.map.get(n));
						return r == undefined ? '#FFFFFF' : r;
					})
					.attr("d", u.path);

				u.g.append("path")
					.datum(topojson.mesh(shp,shp.objects[j],function(a, b) { return a !== b; }))
					.attr("d", u.path)
					.attr("stroke-width",0.1)
					.attr("class", "state_contour")
					.on("mousemove",function(e){
						//console.log(e);
					});
			}
		},
		zoomed: function() {
			u.g.attr("transform", d3.event.transform);
		},
		config: {
			states: "data/br-states.json",
			municipios: "data/municipios.json"
		},
		load: function (url,reset = false) {
			if(reset){
				console.log("reset")
				d3.select("svg").remove();
			}
			svg = d3.select("body").append("svg")
						.attr("width", u.getScreenSize().x)
						.attr("height", u.getScreenSize().y),
				g = svg.append("g");
			u.g = g;
			var zoom = d3.zoom()
					     .scaleExtent([1, 40])
					     .translateExtent([[-100, -100], [u.getScreenSize().x , u.getScreenSize().y ]])
						 .on("zoom", u.zoomed);
			svg.call(zoom);

			var projection = d3.geoMercator()
							   .scale(u.getScreenSize().x - 200)
							   .center([-52, -15])
							   .translate([u.getScreenSize().x / 2, u.getScreenSize().y / 2]),
				path = d3.geoPath()
						 .projection(projection);

			u.path = path;
			u.map = d3.map();
			u.cor = d3.scaleThreshold()
				    .domain([15, 30, 45, 60, 75, 90])
				    .range(["#FFFFC1", "#FFFF4F", "#D5FF33", "#04FF04", "#08D92E", "#08A463", "#006E91"]);

			d3.queue()
				.defer(d3.json, url)
				.defer(d3.tsv,"data/enempardo.tsv", function(d) {
					//console.log(d); 
					u.map.set(d.municipio, d.percentual); 
				})
				.await(u.ready);

			
			//d3.select(self.frameElement).style("height", u.height + "px");
		}
	};
	form.main();
	//u.load(u.config.states);
	u.load(u.config.municipios);

})(window);