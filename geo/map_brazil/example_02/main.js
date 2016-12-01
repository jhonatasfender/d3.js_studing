(function(w){
	var form = {
		f: function(d) {
		 	var select = document.getElementById("estados");
		 	console.log(select.value.toLowerCase());
		 	if(select.value.toLowerCase() == "todos")
				u.load(u.config.municipios,true);
		 	else 
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
		g: null,path: null, map: null, cor: null, reset: null,centered:null,zoom: null,svg: null,
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
				u.size = d3.selectAll("g").node().getBBox();
				var center = d3.geoCentroid(topojson.feature(shp,shp.objects[j]));
				var scale  = 100;
				var offset = [u.getScreenSize().x/2, u.getScreenSize().y/2];
				u.projection = d3.geoMercator().scale(scale).center(center)
				.translate(offset);
				u.path = d3.geoPath().projection(u.projection);
				var bounds  = u.path.bounds(topojson.feature(shp,shp.objects[j]));
				var hscale  = scale*u.getScreenSize().x  / (bounds[1][0] - bounds[0][0]);
				var vscale  = scale*u.getScreenSize().y / (bounds[1][1] - bounds[0][1]);
				var scale   = (hscale < vscale) ? hscale : vscale;
				var offset  = [(u.getScreenSize().x - (bounds[0][0] + bounds[1][0])/2),
				    (u.getScreenSize().y - (bounds[0][1] + bounds[1][1])/2) - 10];
				u.projection = d3.geoMercator().center(center)
				.scale(scale - 500).translate(offset);
				u.path = u.path.projection(u.projection);
				u.g.selectAll("." + j).data(topojson.feature(shp,shp.objects[j]).features)
					.enter().append("path").attr("fill", function(d) { 
						var n = d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome.toUpperCase(),r = u.cor(u.map.get(n));
						return r == undefined ? '#FFFFFF' : r;
					}).attr('class','state').attr("d", u.path);

				u.g.append("path").datum(topojson.mesh(shp,shp.objects[j]/*,function(a, b) { return a !== b; }*/))
					.attr("d", u.path).attr("stroke-width",j == "estados" || j != "municipios" ? 1 : 0.1)
					.attr("class", "state_contour");
			}
		},
		size: null,
		zoomed: function() {
			u.g.attr("transform", d3.event.transform);
		},
		config: {
			states: "data/br-states.json",
			municipios: "data/municipios.json"
		},
		scale: function (){
			//u.getScreenSize().x - 200
			s = 600;
			return u.getScreenSize().x;
		},
		sizeChange: function (){
			//d3.select("g").attr("transform", "scale(" +  + ")");
		},
		load: function (url,reset = false) {
			if(reset){
				console.log("reset")
				d3.selectAll("svg").remove();
			}

			d3.select(window)
    			.on("load", u.sizeChange);
				svg = d3.select("body").append("svg")
							.attr("width", u.getScreenSize().x)
							.attr("height", u.getScreenSize().y),
					g = svg.append("g");
				u.svg = svg;
				u.g = g;
				var zoom = d3.zoom()
						     .scaleExtent([1, 40])
						     .translateExtent([[-100, -100], [u.getScreenSize().x , u.getScreenSize().y ]])
							 .on("zoom", u.zoomed);
				u.zoom = zoom;
				svg.call(zoom);
				u.map = d3.map();
				u.cor = d3.scaleThreshold()
					    .domain([10,15, 30, 45, 60, 75, 90])
					    .range(["#FFFFC1", "#FFFF4F", "#D5FF33", "#04FF04", "#08D92E", "#08A463", "#006E91"]);
			d3.queue()
				.defer(d3.json, url)
				.defer(d3.tsv,"data/enempardo.tsv", function(d) {
					u.map.set(d.municipio, d.percentual); 
				})
				.await(u.ready);
		}
	};
	form.main();
	u.load(u.config.municipios);

})(window);