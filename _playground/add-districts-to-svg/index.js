var fs = require('fs');
var xml2js = require('xml2js');
var argv = require('minimist')(process.argv.slice(2));
var turf = require('turf')

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();

init();

// Query Overpass for data
// [out:json][timeout:25];
// (
//   relation["admin_level"="10"]({{bbox}});
// );
// out body;
// >;
// out skel qt;

function init(){
	if (argv.districts && argv.svg) {
		fs.readFile(argv.svg, function(err, data) {
		    parser.parseString(data, function (err, result) {
		    	var output = result;
		    	var polygons = result.svg.polygon;
		    	fs.readFile(argv.districts, function(err, data) {
		    		var districts = JSON.parse( data ).features;
				    iterateOverPolygons(polygons, districts);
				    output.polygon = polygons;
				    var xml = builder.buildObject(output);
				    fs.writeFile("output.xml", xml, function(err) {});
				});
		    });
		});
	}else{
		console.log("Please specify files. E.g. 'node index.js --svg yourSvgFile.svg --districts districtsGeojson.json' ")
	}
}

function iterateOverPolygons(polygons, districts){
	console.log( districts );

	var resultCounter = 0;
	for (var i = 0; i < polygons.length; i++) {
		var polygon = polygons[i].$;
		var centroid = polygon.moovel_centroidlatlon.split(',');
		centroid[0] = parseFloat(centroid[0]);
		centroid[1] = parseFloat(centroid[1]);
		console.log('');
		console.log( 'Parking space at ' + centroid[0] + ',' + centroid[1]);

		var centroidPoint = turf.point(centroid);

		for (var j = 0; j < districts.length; j++) {
			var district = districts[j];
			if (district.geometry.type == 'Polygon') {
				var districtPolygon = turf.polygon( district.geometry.coordinates );
				var isInside = turf.inside(centroidPoint, districtPolygon);
				if (isInside) {
					resultCounter ++;
					polygon.moovel_district = district.properties.name;
					console.log('   Located in ' + district.properties.name);
				};
			};
		};
	};

	console.log('');
	console.log('-----');
	console.log('');
	console.log('Parking Spaces: ' + polygons.length);
	console.log('Results found: ' + resultCounter);
	console.log('');
	console.log('-----');
	console.log('');
}