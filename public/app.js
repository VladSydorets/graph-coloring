// initial variables
const svg = d3.select("svg");
const width = svg.attr("width");
const height = svg.attr("height");
const radius = 15;

// data structure for vertices
let nodes = [
  {id: 1, color:7},
  {id: 2, color:7},
  {id: 3, color:7},
  {id: 4, color:7},
  {id: 5, color:7}
];

// data structure for edges
let links = [
  {source:0, target:3,color:1},
  {source:0, target:2,color:1},
  {source:1, target:2,color:1},
  {source:1, target:3,color:1},
  {source:2, target:4,color:1},
  {source:3, target:4,color:1},
  {source:1, target:4,color:1},
  {source:2, target:3,color:1}
];

const colors = d3.schemeCategory10; // all possible colors are from d3.js 
let mousedownNode = null;

const modes = ['drag', 'connect', 'add']; // all possible modes
let active_mode = modes[0]; // active mode of the app

let coloring_type='vertex';

// drag logic 
let drag = d3
    .drag()
    .filter(() => active_mode == 'drag')
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

function dragstarted(d) {
  if(active_mode === 'drag') {
    if (!d3.event.active) force.alphaTarget(0.1).restart();
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
}

function dragged(d) {
  if(active_mode === 'drag') {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
}

function dragended(d) {
  if(active_mode === 'drag') {
    if (!d3.event.active) force.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

let lastNodeId = nodes.length;

let dragLine = svg.append("path").attr("class", "dragLine hidden").attr("d", "M0,0L0,0");

let edges = svg.append("g").selectAll(".edge");

let vertices = svg.append("g").selectAll(".vertex").call(drag);

// force(movement) logic
let force = d3
  .forceSimulation()
  .force(
    "charge",
    d3
      .forceManyBody()
      .strength(-700)
  )
  .force(
    "link",
    d3
      .forceLink()
      .distance(100)
      .strength(0.75)
  )
  .force("x", d3.forceX(width / 2).strength(0.1))
  .force("y", d3.forceY(height / 2).strength(0.1))
  .force("collide", d3.forceCollide(30).strength(0.9))
  .on("tick", tick);

force.nodes(nodes);
force.force("link").links(links)

// buttons logic
d3.select("#clear-btn").on("click", clearGraph);

let addBtn = d3.select("#add-btn").on("click", ()=> {
  active_mode = active_mode === 'add' ? modes[0] : modes[2]
  updateBtn();
});

let connectBtn = d3.select("#connect-btn").on("click", ()=> {
  active_mode = active_mode === 'connect' ? modes[0] : modes[1]
  updateBtn();
});

// updates active button by applying a class 'active'
function updateBtn() {
  if(active_mode === 'add') {
    connectBtn.classed("active", false);
    addBtn.classed("active", true);
  }
  else if(active_mode === 'connect') {
    addBtn.classed("active", false);
    connectBtn.classed("active", true);
  } else {
    addBtn.classed("active", false);
    connectBtn.classed("active", false);
  }
}

// buttons to choose what to color: a vertex or an edge
let vertexBtn = d3.select("#vertex-btn").on("click", ()=> {
  if(coloring_type === 'edge') {
    edgeBtn.classed("active", false);
    vertexBtn.classed("active", true);
    coloring_type = 'vertex';
  }
})

let edgeBtn = d3.select("#edge-btn").on("click", ()=> {
  if(coloring_type === 'vertex') {
    vertexBtn.classed("active", false);
    edgeBtn.classed("active", true);
    coloring_type = 'edge';
  }
})

// export button logic
d3.select("#export-btn").on("click", ()=> {
  let svgString = getSVGString(svg.node());
  svgString2Image(svgString, 2*width, 2*height, 'png', save);

  function save( dataBlob, filesize ){
		saveAs( dataBlob, 'graph-name.png' ); // FileSaver.js function
	}
})

// the functions that handle the actual exporting:
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	let cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	let serializer = new XMLSerializer();
	let svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		let selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (let c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		let nodes = parentElement.getElementsByTagName("*");
		for (let i = 0; i < nodes.length; i++) {
			let id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			let classes = nodes[i].classList;
			for (let c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		let extractedCSSText = "";
		for (let i = 0; i < document.styleSheets.length; i++) {
			let s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			let cssRules = s.cssRules;
			for (let r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		
		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}
	}

	function appendCSS( cssText, element ) {
		let styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		let refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	// let format = format ? format : 'png';

	let imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	let image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			let filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});
	};
	image.src = imgsrc;
}

function clearGraph(){
  nodes.splice(0);
  links.splice(0);
  lastNodeId = 0;
  restart();
}

function tick() {
  edges.attr("x1", function(d) { return d.source.x = Math.max(radius, Math.min(width - radius, d.source.x)); })
       .attr("y1", function(d) { return d.source.y = Math.max(radius, Math.min(height - radius, d.source.y)); })
       .attr("x2", function(d) { return d.target.x = Math.max(radius, Math.min(width - radius, d.target.x)); })
       .attr("y2", function(d) { return d.target.y = Math.max(radius, Math.min(height - radius, d.target.y)); });

  vertices.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
       .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
}

function addNode(){
  if(active_mode === 'add'){
    let e = d3.event;
    if(e.button==0){
      let coords = d3.mouse(e.currentTarget);
      let newNode = {x:coords[0], y:coords[1], color:7, id:++lastNodeId};
      nodes.push(newNode);
      restart();
    }
  }
}

function removeNode(d, i){
  let e = d3.event;
  if(e.ctrlKey) return;

  nodes.splice(nodes.indexOf(d),1);
  let linksToRemove = links.filter(function(l){
    return l.source===d || l.target===d;
  });
  linksToRemove.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
  e.preventDefault();
  restart();
}

function removeEdge(d, i){
  links.splice(links.indexOf(d),1);
  d3.event.preventDefault();
  restart();
}

function beginDragLine(d){
  if(active_mode === 'connect'){
    let e = d3.event;
    //to prevent call of addNode through svg
    e.stopPropagation();
    //to prevent dragging of svg in firefox
    e.preventDefault();
    if(e.ctrlKey || e.button!=0) return;
    mousedownNode = d;
    dragLine.classed("hidden", false)
            .attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
              "L" + mousedownNode.x + "," + mousedownNode.y);
  }
}

function updateDragLine(){
  if(!mousedownNode) return;
  let coords = d3.mouse(d3.event.currentTarget);
	dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
									"L" + coords[0] + "," + coords[1]);
}

function hideDragLine(){
    dragLine.classed("hidden", true);
    mousedownNode = null;
}

function endDragLine(d){
  if(active_mode === 'connect'){  
    if(!mousedownNode || mousedownNode===d) return;
      //return if link already exists
      for(let i=0; i<links.length; i++){
        let l = links[i];
        if((l.source===mousedownNode && l.target===d) || (l.source===d && l.target===mousedownNode)){
          return;
        }
      }
      let newLink = {source: mousedownNode, target:d, color:7};
      links.push(newLink);
      restart();
  }
}

function changeVertexColor(d){
  let e = d3.event;
  if(e.ctrlKey || e.button!=0) return;
  let thisVertex = d3.select(e.currentTarget);
  if(coloring_type == 'vertex') {
    thisVertex.style("fill", function(d){
      d.color = (1+d.color)%10;
      checkCorrectness()
      return colors[d.color];
    });
  }
}

function changeEdgeColor(d){
  let e = d3.event;
  if(e.ctrlKey || e.button!=0) return;
  let thisEdge = d3.select(e.currentTarget);
  if(coloring_type == 'edge') {
    thisEdge.style("stroke", function(d){
      d.color = (1+d.color)%10;
      checkCorrectness()
      return colors[d.color];
    });
  }
}

function checkCorrectness(){
  let word = d3.select("#word-correctness");
  let flag = true;

  links.forEach(link => {
    if(link.source.color == link.target.color) flag = false
    if(link.color == link.source.color || link.color == link.target.color) flag = false
  })

// check if the edge is colored correctly
  for(let i = 0; i < links.length; i++) {
    for(let j = i+1; j < links.length; j++) {
      if(links[i].source.id == links[j].target.id && links[i].color == links[j].color) flag = false
      if(links[i].source.id == links[j].source.id && links[i].color == links[j].color) flag = false
      if(links[i].target.id == links[j].target.id && links[i].color == links[j].color) flag = false
      if(links[i].target.id == links[j].source.id && links[i].color == links[j].color) flag = false
    }
  }

// if true, change the text and color of the text to green
// if false, change the text and color of the text to red
  if (flag) {
    word.text('correctly')
    .classed('green-color', true)
    .classed('red-color', false)
  }
  else {
    word.text('incorrectly')
    .classed('red-color', true)
    .classed('green-color', false)
  }
}

// function that restarts animations and etc.
function restart() {
  checkCorrectness();

  edges = edges.data(links, function(d) {
    return "v" + d.source.id + "-v" + d.target.id;
  });
  edges.exit().remove();

  let ed = edges
    .enter()
    .append("line")
    .attr("class", "edge")
    .on("click", changeEdgeColor)
    .on("mousedown", function() {
      d3.event.stopPropagation();
    })
    .on("contextmenu", removeEdge);

  ed.append("title").text(function(d) {
    return "v" + d.source.id + "-v" + d.target.id;
  });

  edges = ed.merge(edges);

  vertices = vertices.data(nodes, function(d) {
    return d.id;
  });
  vertices.exit().remove();

  let ve = vertices
    .enter()
    .append("circle")
    .attr("r", radius)
    .attr("class", "vertex")
    .style("fill", function(d, i) {
      return colors[d.color];
    })
    .on("mousedown", beginDragLine)
    .on("mouseup", endDragLine)
    .on("click", changeVertexColor)
    .on("contextmenu", removeNode)
    .call(drag);

  ve.append("title").text(function(d) {
    return d.id + " vertex";
  });

  vertices = ve.merge(vertices);

  force.nodes(nodes);
  force.force("link").links(links);
  force.alpha(0.3).restart();
}

svg.on("mousedown", addNode)
	  .on("mousemove", updateDragLine)
	  .on("mouseup", hideDragLine)
	  .on("contextmenu", function(){d3.event.preventDefault();})
	  .on("mouseleave", hideDragLine);  

restart();