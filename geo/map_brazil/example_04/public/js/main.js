(function(w) {
    var form = {
            f: function(d) {
                var select = document.getElementById("estados");
                if(select.value.toLowerCase() == "todos")
                    u.load(u.config.municipios, true);
                else {
                    console.log(u.uf[select.value]);
                    u.load("topo/" + select.value.toLowerCase() + ".json", true);
                }
            },
            main: function() {
                form.body = d3.select("body");
                form.div = form.body.append('div').attr('class', 'mapas');
                form.filtro = form.div.append('div').attr('class', 'filtros-mapa col-md-3 col-sm-4 col-xs-7');
                form.span = form.filtro.append('span').attr('class', 'instrucao').text('PAINEL DE CONTROLE');
                form.a = form.filtro.append('a');
                form.i = form.a.append('i').attr('class', 'close fa fa-times');
                form.divFormGroup = form.filtro.append('div').attr('class', 'form-group');
                form.label = form.divFormGroup.append('label').attr('class', 'amarelo').text('Selecione UF:');
                form.select = form.divFormGroup.append('select').attr('id', 'estados').attr('class', 'selectpicker form-control');
                for(var j in u.uf.length) { 
                    console.log(u.uf[j]);
                    form.select.append('option').attr('value', u.ufs[j]).text(u.ufs[j]);
                }
                form.button = form.filtro.append('button')
                    .attr('class', 'btn btn-primary btn-lg btn-block btn-mapa')
                    .text('OK')
                    .on('click', form.f);
            }
        },
        u = {
            //ufs: ["Todos", "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
            g: null,
            path: null,
            map: null,
            cor: null,
            reset: null,
            centered: null,
            zoom: null,
            svg: null,
            divLabel: null,
            getScreenSize: function() {
                var d = document,
                    e = d.documentElement,
                    g = d.getElementsByTagName('body')[0],
                    x = w.innerWidth || e.clientWidth || g.clientWidth,
                    y = w.innerHeight || e.clientHeight || g.clientHeight;

                return {x: x,y: y};
            },
            ready: function(error, shp) {
                if(error) throw error;

                for(var j in shp.objects) {
                    u.size = d3.selectAll("g").node().getBBox();
                    var center = d3.geoCentroid(topojson.feature(shp, shp.objects[j]));
                    var scale = 500;
                    var offset = [u.getScreenSize().x / 2, u.getScreenSize().y / 2];
                    u.projection = d3.geoMercator()
                        .scale(scale)
                        .center(center)
                        .translate(offset);
                    u.path = d3.geoPath().projection(u.projection);
                    var bounds = u.path.bounds(topojson.feature(shp, shp.objects[j]));
                    var hscale = scale * u.getScreenSize().x / (bounds[1][0] - bounds[0][0]);
                    var vscale = scale * u.getScreenSize().y / (bounds[1][1] - bounds[0][1]);
                    var scale = (hscale < vscale) ? hscale : vscale;
                    var offset = [(u.getScreenSize().x - (bounds[0][0] + bounds[1][0]) / 2)
                        , (u.getScreenSize().y - (bounds[0][1] + bounds[1][1]) / 2)];
                    u.projection = d3.geoMercator()
                        .center(center)
                        .scale(scale)
                        .translate(offset);
                    u.path = u.path.projection(u.projection);
                    u.g.selectAll("." + j)
                        .data(topojson.feature(shp, shp.objects[j]).features)
                        .enter()
                        .append("path")
                        .attr("fill", function(d) {
                            var n = d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome.toUpperCase(),
                                r = u.cor(u.map.get(n));
                            return r == undefined ? '#FFFFFF' : r;
                        })
                        .attr('class', 'state')
                        .attr("d", u.path)
                        .on('mousemove', function(d) {
                            var mouse = d3.mouse(u.svg.node()).map(function(d) {
                                return parseInt(d);
                            });

                            var n = d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome.toUpperCase(),
                                r = u.map.get(n);
                            u.divLabel
                            	.attr('style', 'display:block;left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
                        		.html(
                                    (d.properties.nome == undefined ? d.properties.NM_MUNICIP : d.properties.nome) + "<br>" +
                                    "Percentual: " + ( r == undefined ? "0.0" : r ) + "%"
                                );
                            //console.log(d.properties);
                        })
		                .on('mouseout', function(d) {
		                    u.divLabel.attr('style', 'display:nome').html("");
		                });
                    u.g.append("path")
                        .datum(topojson.mesh(shp, shp.objects[j] /*,function(a, b) { return a !== b; }*/ ))
                        .attr("d", u.path)
                        .attr("stroke-width", j == "estados" || j != "municipios" ? 1 : 0.1)
                        .attr("class", "state_contour");
                }
            },
            size: null,
            zoomed: function() {
				/*d3.selectAll("path").attr("stroke-width",function (){
					console.log(f);
				});*/
            	u.divLabel.attr('style', 'display:nome').html("");
                u.g.attr("transform", d3.event.transform);
            },
            config: {
                states: "data/br-states.json",
                municipios: "data/municipios.json"
            },
            scale: function() {
                //u.getScreenSize().x - 200
                s = 600;
                return u.getScreenSize().x;
            },
            sizeChange: function() {
                //d3.select("g").attr("transform", "scale(" +  + ")");
            },
            load: function(url, reset = false) {
                if(reset) {
                    d3.selectAll("svg").remove();
                }
                d3.select(window)
                    .on("load", u.sizeChange);
                var divLabel = d3.select("body")
                    .append("div")
                    .attr('class', 'divLabel'), 
                svg = d3.select("body")
                    .append("svg")
                    .attr("width", u.getScreenSize().x)
                    .attr("height", u.getScreenSize().y), 
                g = svg.append("g");
                u.svg = svg;
                u.g = g;
                u.divLabel = divLabel;
                var zoom = d3.zoom()
                    //.scaleExtent([1, 40])
                    //.translateExtent([[-100, -100], [u.getScreenSize().x, u.getScreenSize().y]])
                    .on("zoom", u.zoomed);
                u.zoom = zoom;
                u.svg.call(zoom);
                u.map = d3.map();
                u.cor = d3.scaleThreshold()
                    .domain([0.0, 30, 50, 70, 90, 100])
                    .range(["#FFFFC1", "#FFFF4F", "#D5FF33", "#04FF04", "#08D92E", "#08A463", "#006E91"]);
                d3.queue()
                    .defer(d3.json, url)
                    .defer(d3.tsv, "data/enempardo.tsv", function(d) {
                        if(u.uf[d.uf] == undefined)
                            u.uf[d.uf] = new Array();
                        u.uf[d.uf].push(d.municipio);
                        u.map.set(d.municipio, d.percentual);
                    })
                    .await(u.ready);
            }
        };
    u.uf = new Array();
    u.load(u.config.municipios);
    form.main();
})(window);