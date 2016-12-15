var fs = require('fs');
var xml2js = require('xml2js');
var argv = require('minimist')(process.argv.slice(2));
var turf = require('turf')

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();

var fileName;

init();

function init(){
	fileName = argv.output || "output.svg";

	if (argv.neighborhoods && argv.svg) {
		fs.readFile(argv.svg, function(err, data) {
		    parser.parseString(data, function (err, result) {
		    	var output = result;
		    	var polygons = result.svg.polygon;
		    	fs.readFile(argv.neighborhoods, function(err, data) {
		    		if (err) {
		    			console.log(err);
		    		};
		    		var neighborhoods = JSON.parse( data ).features;
				    iterateOverPolygons(polygons, neighborhoods);
				    output.polygon = polygons;
				    var xml = builder.buildObject(output);
				    fs.writeFile(fileName, xml, function(err) {});
				});
		    });
		});
	}else{
		console.log('');
		console.log('--------------');
		console.log("  HOW TO RUN  ");
		console.log('--------------');
		console.log('');
		console.log(" node index.js --svg yourSvgFile.svg --neighborhoods neighborhoodsGeojson.json --output berlin_neighborhoods.svg");
		console.log('');
		console.log("  - svg:       The svg file you want to be altered. Needs to contain the 'moovel_centroidlatlon' meta tag");
		console.log("  - neighborhoods: A json obtained from Overpass Turbo containing the polygons for the neighborhoods.")
		console.log("  - output:    [Optional] Specify the name (and location) of the altered svg file");	
		console.log('');
		console.log('Exiting now!');
		console.log('');
	}
}

function iterateOverPolygons(polygons, neighborhoods){
	var resultCounter = 0;
	var unknownParkingSpotLocations = [];

	for (var i = 0; i < polygons.length; i++) {
		var polygon = polygons[i].$;
		var centroid = polygon.moovel_centroidlatlon.split(',');
		centroid[0] = parseFloat(centroid[0]);
		centroid[1] = parseFloat(centroid[1]);
		console.log('');
		console.log( 'Parking space at ' + centroid[0] + ',' + centroid[1]);

		var centroidPoint = turf.point(centroid);

		var returnedResult = false;
		for (var j = 0; j < neighborhoods.length; j++) {
			var neighborhood = neighborhoods[j];
			if (neighborhood.geometry.type == 'Polygon' || neighborhood.geometry.type == 'MultiPolygon') { //a fix that I can't write proper Overpass Queries
				if (neighborhood.geometry.type == 'Polygon') {
					var neighborhoodsPolygon = turf.polygon( neighborhood.geometry.coordinates );	
				}else{
					var neighborhoodsPolygon = turf.multiPolygon( neighborhood.geometry.coordinates );	
				}
				
				var isInside = turf.inside(centroidPoint, neighborhoodsPolygon);
				if (isInside) {
					returnedResult = true;
					resultCounter ++;
					var properties = neighborhood.properties;
					var name = properties.name || properties.ntaname || properties.NAME
					//       = default         || for New York City  || for Portland

					polygon.moovel_neighborhood = neighborhood.properties.name;
					console.log('   Located in ' + neighborhood.properties.name);
					break;
				};
			};
		};
		if (returnedResult == false) {
			unknownParkingSpotLocations.push(centroid);
		}
	};

	console.log('');
	console.log('-----');
	console.log('');
	console.log('Parking Spaces: ' + polygons.length);
	console.log('Results found: ' + resultCounter);
	console.log('');
	console.log('Not found (' + (polygons.length - resultCounter) + ')')
	for (var i = 0; i < unknownParkingSpotLocations.length; i++) {
		var parking = unknownParkingSpotLocations[i];
		console.log('   ' + i + ' LatLon ' + parking[1] + ',' + parking[0]);
	};
	console.log('');
	console.log('-----');
	console.log('');
	console.log('New svg has been saved: ' + fileName);
	console.log('');
	console.log('-----');
}