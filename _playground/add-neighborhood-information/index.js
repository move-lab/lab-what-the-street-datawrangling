var fs = require('fs');
var turf = require('turf');
var argv = require('minimist')(process.argv.slice(2));
var xml2js = require('xml2js');
var mongodb = require('mongodb');

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();
var MongoClient = mongodb.MongoClient;

init();

function init(){
	if (argv.svg && argv.mongodb) {
		console.log('Please use either --svg or --mongodb, not both');
		printInstructions();
	}else if (argv.neighborhoods && argv.mongodb && argv.collection) {
		processForMongodb();
	}else if (argv.neighborhoods && argv.svg) {
		processForSvg();
	}else{
		printInstructions();
	}
}

function processForMongodb(){
	var mongoUrl = argv.mongodb;
	MongoClient.connect(mongoUrl, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			fs.readFile(argv.neighborhoods, function(err, data) {
	    		if (err) {
	    			console.log(err);
	    		}
	    		var resultCounter = 0;
	    		var neighborhoods = JSON.parse( data ).features;
	    		var collection = db.collection(argv.collection);
	    		collection.find({}).toArray(function (err, results) {
	    			var unknownWayLocations = [];
	    			for (var i = 0; i < results.length; i++) {
	    				var result = results[i];
	    				var nodes = result.nodes;

	    				var neighborhoodName;
	    				for (var node in nodes){
		    				var coordinate = [ nodes[node].lon, nodes[node].lat];
		    				neighborhoodName = getNeighborhoodName(coordinate, neighborhoods);

		    				console.log('');
							console.log( 'Way at ' + coordinate[0] + ',' + coordinate[1]);
		    				if (neighborhoodName != null) {
		    					resultCounter ++;
		    					console.log('   Located in ' + neighborhoodName);
		    					result.tags.neighborhood = neighborhoodName;
		    					collection.update({_id: result["_id"]}, result);
		    					break;
		    				}
	    				}

	    				if (neighborhoodName == null) {
		    				console.log('   No matching neighborhood found :(');
		    				unknownWayLocations.push(coordinate)
	    				};
	    			};

	    			console.log('');
					console.log('-----');
					console.log('');
					console.log('Ways:          ' + results.length);
					console.log('Results found: ' + resultCounter);
					console.log('');
					console.log('Not found (' + (results.length - resultCounter) + ')')
					for (var i = 0; i < unknownWayLocations.length; i++) {
						var coordinate = unknownWayLocations[i];
						console.log('   ' + i + ' LatLon ' + coordinate[1] + ',' + coordinate[0]);
					};
					db.close();

					console.log('');
					console.log('-----');
					console.log('');
					console.log('MongoDB has been updated');
					console.log('');
					console.log('-----');

	    		})
	    	})
		}
	});
}

function processForSvg(){
	var fileName = argv.output || "output.svg";
	fs.readFile(argv.svg, function(err, data) {
	    parser.parseString(data, function (err, result) {
	    	if (err) {
	    		console.log(err);
	    	};
	    	var output = result;
	    	var polygons = result.svg.polygon;
	    	fs.readFile(argv.neighborhoods, function(err, data) {
	    		if (err) {
	    			console.log(err);
	    		}
	    		var neighborhoods = JSON.parse( data ).features;
			    iterateOverPolygons(polygons, neighborhoods);

			    output.polygon = polygons;
			    var xml = builder.buildObject(output);
			    fs.writeFile(fileName, xml, function(err) {
			    	console.log(err);
			    });

			    console.log('');
				console.log('-----');
				console.log('');
				console.log('New svg has been saved: ' + fileName);
				console.log('');
				console.log('-----');
			});
	    });
	});
}

function printInstructions(){
	console.log('');
	console.log('--------------');
	console.log("  HOW TO RUN  ");
	console.log('--------------');
	console.log('');
	console.log(" node index.js --svg yourSvgFile.svg --neighborhoods neighborhoodsGeojson.json --output berlin_neighborhoods.svg");
	console.log('');
	console.log("  - svg:           [For parking spaces] The svg file you want to be altered. Needs to contain the 'moovel_centroidlatlon' meta tag");
	console.log("  - output:        [Optional and only for svg] Specify the name (and location) of the altered svg file");	
	console.log("  - mongodb:       [For ways] The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin");
	console.log("  - collection:    [Only for mongodb] Name of the collection which should be queried")
	console.log("  - neighborhoods: [Necessary] A json obtained from Overpass Turbo containing the polygons for the neighborhoods.")
	console.log('');
	console.log('Exiting now!');
	console.log('');
}

function getNeighborhoodName(coordinate, neighborhoods){
	var point = turf.point(coordinate);

	for (var j = 0; j < neighborhoods.length; j++) {
		var neighborhood = neighborhoods[j];
		var geometryType = neighborhood.geometry.type;
		if (geometryType == 'Polygon' || geometryType == 'MultiPolygon') { //a fix that I can't write proper Overpass Queries
			if (geometryType == 'Polygon') {
				var neighborhoodsPolygon = turf.polygon( neighborhood.geometry.coordinates );	
			}else{
				var neighborhoodsPolygon = turf.multiPolygon( neighborhood.geometry.coordinates );	
			}
			
			var isInside = turf.inside(point, neighborhoodsPolygon);
			if (isInside) {
				var properties = neighborhood.properties;
				var name = properties.name || properties.ntaname || properties.NAME || properties.Name
				//       = default         || for New York City  || for Portland    || for Boston

				return name;
				break; //If neighborhoods would overlap you would get multiple results, this way you only get the first match
			};
		};
	};
	return null;
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

		var neighborhoodName = getNeighborhoodName(centroid, neighborhoods);
		if (neighborhoodName != null) {
			resultCounter ++;
			polygon.moovel_neighborhood = neighborhoodName;
			console.log('   Located in ' + neighborhoodName);
		}else{
			console.log('   No matching neighborhood found :(');
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
}