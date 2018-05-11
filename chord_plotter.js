var longnames = ["Precipitation", "Temperature", "Soil Moisture", "Latent Heat", "Sensible Heat", "Shortwave"];
var colors = ["#51addf", "#c582aa", "#005b9d", "#35a993", "#cc373c", "#f7d783"];
var opacity = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9];


function main() {
    var svg = d3.select("#diagram")
                .select("svg")
			    .remove();
	readData();
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function readData() {
	var fname = $('input[name=fname]').val();
	var remove_diag = document.getElementById('diag').checked;
	var out;
	d3.csv(fname, function(data) {
		var names = Object.keys(data[1]);
		names.shift();
		out = createArray(names.length, names.length);
		data.forEach(function(d, i, a) {
			names.forEach(function(n, j, b) {
				out[i][j] = Math.round(1000*parseFloat(d[n]))/1000;
			});
		});
		if (remove_diag) {
			for (i=0; i<names.length; i++) {
				out[i][i] = 0.0
			}
		}
		drawChords(out, longnames, colors);
	});
	return out;
}

function drawChords(matrix, names, colors) {
    var w = 700;
    var h = 700;

    var margin = {top: 20,
                  bottom: 0,
                  left: 0,
                  right: 0}

    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;

    var svg = d3.select("#diagram")
                .append("svg")
                .attr("id", "chart")
                .attr("width", w)
                .attr("height", h)

    var wrapper = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    var outerRadius = Math.min(width, height) * 0.5 -55
    var innerRadius = outerRadius - 30
    var chordGenerator = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)
    var chord = chordGenerator(matrix);
    var arcs = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    var ribbon = d3.ribbon().radius(250)

    var opacities = d3.scaleOrdinal()
      .domain(d3.range(names.length))
      .range(opacity)

    var color = d3.scaleOrdinal()
    .domain(d3.range(names.length))
    .range(colors)

    // creating the fill gradient
    function getGradID(d){ return "linkGrad-" + d.source.index + "-" + d.target.index; }


    var grads = svg.append("defs")
      .selectAll("linearGradient")
      .data(chord)
      .enter()
      .append("linearGradient")
      .attr("id", getGradID)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", function(d, i){ return innerRadius * Math.cos((d.source.endAngle-d.source.startAngle) / 2 + d.source.startAngle - Math.PI/2); })
      .attr("y1", function(d, i){ return innerRadius * Math.sin((d.source.endAngle-d.source.startAngle) / 2 + d.source.startAngle - Math.PI/2); })
      .attr("x2", function(d,i){ return innerRadius * Math.cos((d.target.endAngle-d.target.startAngle) / 2 + d.target.startAngle - Math.PI/2); })
      .attr("y2", function(d,i){ return innerRadius * Math.sin((d.target.endAngle-d.target.startAngle) / 2 + d.target.startAngle - Math.PI/2); })

      // set the starting color (at 0%)

    grads.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", function(d){ return color(d.target.index)})

        //set the ending color (at 100%)
    grads.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", function(d){ return color(d.source.index)})

    // making the ribbons
    d3.select("g")
      .selectAll("path")
      .data(chord)
      .enter()
      .append("path")
      .attr("class", function(d) {
        return "chord chord-" + d.source.index + " chord-" + d.target.index // The first chord allows us to select all of them. The second chord allows us to select each individual one.
      })
      .style("fill", function(d){ return "url(#" + getGradID(d) + ")"; })
      .attr("d", ribbon)
      // .style("stroke", function(d){ return d3.rgb(color(d.target.index)).darker(); })
      .style("opacity", function(d){ return 0.6 })

    // making the arcs
    var g = wrapper.selectAll("g")
      .data(chord.groups)
      .enter()
      .append("g")
      .attr("class", "group")


    g.append("path")
      .style("fill", function(d){ return color(d.index)})
      // .style("stroke", function(d){ return d3.rgb(color(d.index)).darker(); })
      .attr("d", arcs)
      //.style("opacity", 1)

    /// adding labels
    g.append("text")
      .each(function(d){ d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("class", "titles")
      .attr("text-anchor", "middle" )//function(d) { return d.angle > Math.PI ? "end" : null; })
      .attr("transform", function(d) {
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
        + "translate(" + (outerRadius + 15) + ")"
        + "rotate(" + (270)  + ")"
        + (d.angle < Math.PI/2 ? "rotate(180)" : "")
        + (d.angle > Math.PI *1.25 ? "rotate(180)" : "");
      })
      .text(function(d,i){ return names[i]; })
      .style("font-size", "18px")

    // Set-up the export button
    d3.select('#saveButton').on('click', function(){
         var svgString = getSVGString(svg.node());
         svgString2Image( svgString, 2*width, 2*height, 'png', save );

         function save( dataBlob, filesize ){
             saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js function
         }
    });
}

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    var cssStyleText = getCSSStyles( svgNode );
    appendCSS( cssStyleText, svgNode );

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

    return svgString;

    function getCSSStyles( parentElement ) {
        var selectorTextArr = [];

        // Add Parent element Id and Classes to the list
        selectorTextArr.push( '#'+parentElement.id );
        for (var c = 0; c < parentElement.classList.length; c++)
                if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
                    selectorTextArr.push( '.'+parentElement.classList[c] );

        // Add Children element Ids and Classes to the list
        var nodes = parentElement.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            if ( !contains('#'+id, selectorTextArr) )
                selectorTextArr.push( '#'+id );

            var classes = nodes[i].classList;
            for (var c = 0; c < classes.length; c++)
                if ( !contains('.'+classes[c], selectorTextArr) )
                    selectorTextArr.push( '.'+classes[c] );
        }

        // Extract CSS Rules
        var extractedCSSText = "";
        for (var i = 0; i < document.styleSheets.length; i++) {
            var s = document.styleSheets[i];

            try {
                if(!s.cssRules) continue;
            } catch( e ) {
                    if(e.name !== 'SecurityError') throw e; // for Firefox
                    continue;
                }

            var cssRules = s.cssRules;
            for (var r = 0; r < cssRules.length; r++) {
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
        var styleElement = document.createElement("style");
        styleElement.setAttribute("type","text/css");
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore( styleElement, refNode );
    }
}


function svgString2Image(svgString, width, height, format, callback) {
    var format = format ? format : 'png';
    var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = function() {
        context.clearRect ( 0, 0, width, height );
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob( function(blob) {
            var filesize = Math.round( blob.length/1024 ) + ' KB';
            if ( callback ) callback( blob, filesize );
        });
    };
    image.src = imgsrc;
}

