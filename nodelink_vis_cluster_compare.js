var fuseOptions = {
	id: "id",
	shouldSort: true,
	threshold: 0.3,
	location: 0,
	distance: 1000,
	maxPatternLength: 32,
	minMatchCharLength: 1,
	keys: [
		"id",
		"collection_1.title",
		"collection_2.title",
		"label"
	]
};

var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var manyBody = d3.forceManyBody()
	// .strength(-5);
	.strength(-500);
	;

var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().id(function(d) { return d.id; }))
	// .force("link", d3.forceLink())
	.force("charge", manyBody)
	.force("center", d3.forceCenter(width / 2, height / 2));

var sizeScale = d3.scaleLinear()
	.range([5, 25]);
var linkThicknessScale = d3.scaleLinear()
	// .range([.15, 3]);
	.range([.15, 150]);

// reusable chart pattern inspired by:
// https://bost.ocks.org/mike/chart/
// and
// https://www.toptal.com/d3-js/towards-reusable-d3-js-charts

function NodeLinkClusterCompareVis() {
	var data = [];
	var width = 800;

	var updateData;
	var updateWidth;

	function chart(selection) {
		selection.each(function() {
		// draw chart

		updateWidth = function() {
			// use width to make any changes
		};

		updateData = function() {
			// use D3 update pattern with data
			console.log(updateData);
			var graph = data;
			graph.nodes.forEach(function(d) {
				// d.id = d.id.toString();
				d.num_papers = +d.num_papers;
				d.membership_ratio = d.collection_2.length / (d.collection_1.length + d.collection_2.length);
			});

			sizeScale.domain(d3.extent(graph.nodes, function(d) { return d.num_papers; }));
			linkThicknessScale.domain(d3.extent(graph.links, function(d) { return d.weight; }));


			// var link = svg.append("g")
			var link = selection.append("g")
				.attr("class", "links")
				.selectAll("line")
				.data(graph.links)
				.enter().append("line")
				// .attr("stroke-width", .1)
				// .attr("stroke-width", function(d) { return Math.sqrt(d.weight); });
				// .attr("stroke-opacity", .0001)
				// .attr("stroke-width", function(d) { return Math.min(2, Math.sqrt(d.weight)); });
				.attr("stroke-width", function(d) { return linkThicknessScale(d.weight); });
			;


			// var node = svg.append("g")
			var node = selection.append("g")
				.attr("class", "nodes")
				.selectAll(".node")
				.data(graph.nodes)
				.enter().append("g")
				// .attr("r", 5)
				.attr("class", "node")
				.call(d3.drag()
						.on("start", dragstarted)
						.on("drag", dragged)
						.on("end", dragended))

				var nodeHyperlink = node.append("a");
				// .attr("target", "_blank")
				// .attr("href", function(d) {
				// 	return Flask.url_for("main.cluster", {"cl": d.id});
				// });

			var nodeCircle = nodeHyperlink.append("circle")
				// .attr("r", function(d) { return d.radius = 5; })
				// .attr("fill", "red")
				.attr("r", function(d) { return d.radius = sizeScale(d.num_papers); })
				// .attr("fill", function(d) { return d.color_orig = d.color; })
				.attr("fill", function(d) { return d.color_orig = d3.interpolateCool(d.membership_ratio); })
				// .attr("fill", 'blue')
				;


			function resizeNodes(opt) {
				graph.nodes.forEach(function(d) {
					if (opt === "num_papers_cluster") {
						d.size = d.num_papers;
					} else if (opt === "num_papers_collection_1") {
						d.size = d.collection_1.length;
					} else if (opt === "num_papers_collection_2") {
						d.size = d.collection_2.length;
					}
				});

				sizeScale.domain(d3.extent(graph.nodes, function(d) { return d.size; }));
				nodeCircle
					.transition()
					.duration(300)
					.attr("r", function(d) { return d.radius = sizeScale(d.size); });

				console.log(sizeScale);
			}
			var $radioNodeSize = $( 'input[type=radio][name=radioNodeSize]' );
			$radioNodeSize.change(function() {
				var val = $( 'input[type=radio][name=radioNodeSize]:checked' ).val();
				console.log(val);
				resizeNodes(val);
				console.log(graph);
			});

			// only show links to and from node on mouseover
			function onlyShowActiveLinks(d) {
				link.filter(function(dd) {
					return dd.source != d && dd.target != d;
				}).style("display", "none");
			}
			function showAllLinksAgain(d) {
				link.filter(function(dd) {
					return dd.source != d && dd.target != d;
				}).style("display", "");
			}
			// highlight connected nodes on mouseover
			function highlightConnectedNodes(d) {
				link.each(function(dd) {
					if (dd.source == d || dd.target == d) {
					// d3.select(this).classed("active-link", true);
						nodeCircle.filter(function(n) { 
							return n.id == dd.source.id || n.id == dd.target.id; 
						}).classed("active-link", true);
					}
				});
			}
			function unhighlightNodes() {
				nodeCircle.classed("active-link", false);
			}

			// register event functions
			nodeCircle.on("mouseover", function(d) {
				onlyShowActiveLinks(d);
				highlightConnectedNodes(d);
			});
			nodeCircle.on("mouseout", function(d) {
				showAllLinksAgain(d);
				unhighlightNodes();
			});


			// node.append("text")
			// 	.attr("class", "affil_name")
			// 	.style("display", "none")  // hidden initially
			// 	.text(function(d) { return d.affil_name; });

			// node.append("text")
			// 	.attr("class", "author_name")
			// 	.style("display", "none")  // hidden initially
			// 	.text(function(d) { return d.author_name; });
			// node.selectAll("circle")
			// 	// .attr("title", function(d) {return d.author_name});
			// 	.append("title")
			// 	.text(function(d) {return d.author_name;});

			// nodeCircle.on('click', function(d) {
			// 	node.classed('focus', false);
			// 	node.selectAll("text").style("display", "none");
			// 	nodeCircle.attr("fill", "black")
			// 		.style("opacity", .1);
			// 	link.style("opacity", .1);
			// 	var component_ids = graph.graph.connected_components[d.component];
			// 	var component = node.filter(function(d) {return component_ids.includes(d.id); });
			// 	var componentLink = link.filter(function(d) {return component_ids.includes(d.source.id);})
			// 	var componentColor = d3.scaleOrdinal(d3.schemeCategory10);
			// 	component.classed("focus", true);
			// 	component.selectAll("circle").attr("fill", function(d) { return componentColor(d.cl_bottom); })
			// 		.style("opacity", 1);
			// 	component.selectAll("text").style("display", "");  // show these labels
			// 	componentLink.style("opacity", 1);
			// 	
			// 	$( '#nodelab-form' ).css( 'visibility' , 'visible' );
			// 	applyRadioSelection();
			//
			// 	d3.event.stopPropagation();
			//
			// });

			// node.append("title")
			//     // .text(function(d) { return d.author_name; });
			//     .text(function(d) { 
			// 	  var titles = [];
			// 	  for (var i = 0, len = d.papers.length; i < len; i++) {
			// 	  	titles.push(d.papers[i].title);
			// 	  }
			// 	  return  d.author_name + '\n' + d.cl_bottom + '\n' + titles.join('\n');
			//   });
			// node.attr("title", function(d) {
			// 	  // var titles = [];
			// 	  // for (var i = 0, len = d.papers.length; i < len; i++) {
			// 	  // 	titles.push(d.papers[i].title);
			// 	  // }
			// 	  // return  d.author_name + '\n' + d.cl_bottom + '\n' + titles.join('\n');
			// 	return d.author_name_detex + ' ' + d.affil_name;
			// });

			simulation
				.nodes(graph.nodes)
				.on("tick", ticked);

			simulation.force("link")
				.links(graph.links);


			function ticked() {
				// node
				//     .attr("cx", function(d) { return d.x; })
				//     .attr("cy", function(d) { return d.y; });
				// add bounding box
				// https://bl.ocks.org/mbostock/1129492
				node
					.attr("cx", function(d) { 
						d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
						return d.x; })
					.attr("cy", function(d) { 
						d.y = Math.max(d.radius, Math.min(width - d.radius, d.y));
						return d.y; })
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

				link
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
			}

			// function reset_layout() {
			// 	node.classed("focus", false);
			// 	node.selectAll("text").style("display", "none");
			// 	nodeCircle.attr("fill", function(d) { return d.color_orig; })
			// 		.style("opacity", 1);
			// 	link.style("opacity", 1);
			// 	$( '#nodelab-form' ).css( 'visibility' , 'hidden' );
			// }
			nodeTooltips();
			// svg.on("click", reset_layout);

			var fuse = new Fuse(graph.nodes, fuseOptions);
			var result = fuse.search("ehlow");
			console.log(result);
			$( '#textSearch' ).on( 'input', fuseSelect );
			function fuseSelect() {
				// reset node sizes and styles
				d3.selectAll(".node circle")
					.style("stroke-width", 1)
					.style("stroke", "white")
					.attr("r", function(d) { return d.radius; });

				var $this = $( this );
				var query = $this.val();
				console.log($this.val());
				if (query.length > 3) {
					var result = fuse.search(query);
					if (result.length !=0) {
						for (var i = 0, len = result.length; i < len; i++) {
							var authorId = result[i];
							node.filter(function(d) { return d.id == authorId; })
								.select("circle")
								.style("stroke-width", 2)
								.style("stroke", "black")
								.attr("r", function(d) { return d.radius * 1.5; });
						}
					}
				}
			}
		};
		updateData();
	});
	}

	
	chart.data = function(value) {
		if (!arguments.length) return data;
		data = value;
		console.log(typeof updateData);
		if (typeof updateData === 'function') updateData();
		return chart;
	};

	chart.width = function(value) {
		if (!arguments.length) return width;
		width = value;
		if (typeof updateWidth === 'function') updateWidth();
		return chart;
	};

	return chart;
}



	d3.json("data/cluster_compare_science_communication_and_misinformation.json", function(error, graph) {
		// if (error) throw error;
		console.log(graph);

		//prune
		// graph.nodes.sort(function(a,b) { return d3.descending(+a.num_papers, +b.num_papers) })
		// graph.nodes = graph.nodes.slice(0,20);
		// graph.links = graph.links.filter(function(d) {
		// 	return graph.nodes.includes(d.source) && graph.nodes.includes(d.target)
		// });
		// console.log(graph);
		//
		var nodelinkvis = NodeLinkClusterCompareVis().data(graph).width(width);
		svg.call(nodelinkvis);



	});

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

function nodeTooltips() {
	var windowWidth = $(window).width();
	$('.node').find('circle').tooltipster({
		theme: 'tooltipster-noir',
		maxWidth: windowWidth * .5,
		// animation: null,
		// animationduration: 0,
		// delay: 0,
		// updateAnimation: null,
		// content: "error",
		contentAsHTML: true,
		functionInit: function(instance, helper) {
			// var tooltipHtml = getTooltipHtml(helper.origin);
			// instance.content($(helper.origin).data("tooltipHtml"));
			// d3.select(helper.origin).each(function(d) {instance.content(d.author_name_detex)});
			// instance.content(tooltipHtml);
			$( '#tooltipCheckbox' ).change( function() { this.checked ? instance.enable() : instance.disable(); } );
			instance.content('error');
		},
		functionFormat: tooltipFormat
	});
	// tooltipster-discovery mode so tooltips open quicker in succession
	// https://github.com/louisameline/tooltipster-discovery
	$.tooltipster.group('.node circle');


	function tooltipFormat(instance, helper, content) {
		var thisNode = d3.select(helper.origin);
		var $template = $( '#tooltip-template' ).clone().show();
		function fillHtml(classname, textContent) {
			$template.find( '.' + classname ).find( '.template-content' ).text(textContent);
		}

		thisNode.each(function(d) {
			var cltitle = d.id;
			if (d.label != null) {
				cltitle = cltitle + " - " + d.label;
			}
			fillHtml('cluster_title', cltitle);
			fillHtml('num_papers_cluster', d.num_papers);
			fillHtml('num_papers_collection_1', d.collection_1.length);
			fillHtml('num_papers_collection_2', d.collection_2.length);
			var $paperTitles = $template.find( '.collection_1_paper_titles' ).find( '.template-content' );
			for (var i = 0, len = d.collection_1.length; i < len; i++) {
				$listItem = $( '<li class="paper_title">' ).text(d.collection_1[i].title);
				$paperTitles.append( $listItem );
			}
			var $ethicspaperTitles = $template.find( '.collection_2_paper_titles' ).find( '.template-content' );
			for (var i = 0, len = d.collection_2.length; i < len; i++) {
				$listItem = $( '<li class="paper_title">' ).text(d.collection_2[i].title);
				$ethicspaperTitles.append( $listItem );
			}
		});
		// return $template.html();
		return $template;
	}


	// function getTooltipHtml(node) {
	// 	// store tooltip html as data attribute
	// 	var html;
	// 	d3.select(node).each(function(d) {
	// 		var span = $( '<span>' );
	// 		span.append( $('<p class="tooltip author_name">').text(d.author_name_detex) );
	// 		span.append( $('<p class="tooltip affil_name">').text(d.affil_name) );
	// 		for (var i = 0, len = d.papers.length; i < len; i++) {
	// 			span.append( $( '<p class="tooltip paper_title">' ).text(d.papers[i].title) );
	// 		}
	// 		html = span.html();
	// 	});
	// 	return html;
	// }


}

function applyRadioSelection() {
	var val = $( 'input[type=radio][name=nodelab-radio]:checked' ).val();
	console.log(val);
	$( '.node' ).find( 'text' ).hide();
	if (val !== 'none') {
		$( '.node.focus' ).find( '.' + val ).show();
	}
}


$( document ).ready(function() {
	// var $nodelabRadio = $( 'input[type=radio][name=nodelab-radio]' );
	// $nodelabRadio.change( applyRadioSelection );

})

