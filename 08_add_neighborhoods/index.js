var fs = require('fs');
var dir = require('node-dir');
var turf = require('turf');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var xml2js = require('xml2js');
var mongodb = require('mongodb');

var parser = new xml2js.Parser();
var builder = new xml2js.Builder({ headless: true });
var MongoClient = mongodb.MongoClient;

//async.waterfall()

var allNeighborhoods = [];
var input;
var svgPath;
main();

function main() {
    if (argv.neighborhoods || argv.neighbourhoods && (argv.svg || (argv.mongodb && argv.collection))) {
        input = argv.neighborhoods || argv.neighbourhoods;
        svgPath = argv.svg || argv.svg;
        getNeighborhoods(input);
    } else {
        printInstructions();
    }
}

function getNeighborhoods(input) {
    if (fs.lstatSync(input).isDirectory()) {
        var neighborhoodsDirectory = input;
        getAllNeighborhoods(neighborhoodsDirectory);
    } else {
        var neighborhoodsFile = input;
        getOneNeighborhood(neighborhoodsFile);
        if (argv.mongodb) {
            processForMongodb();
        } else {
            getSvgs(svgPath);
        }
    }
}

function getSvgs(input) {
    var svgFile = input;
    generateSvg(svgFile, allNeighborhoods);
}

function getOneNeighborhood(file, callback) {
    var data = fs.readFileSync(file);
    var neighborhoods = JSON.parse(data).features;
    allNeighborhoods.push(neighborhoods)
}

function getAllNeighborhoods(directory) {
    dir.readFiles(directory, {
            "match": /.geojson$/,
            "exclude": /^\./,
            "recursive": false
        }, function(err, content, next) {
            if (err) throw err;
            var neighborhoods = JSON.parse(content).features;
            allNeighborhoods.push(neighborhoods)
            next();
        },
        function(err, files) {
            if (err) throw err;
            console.log('   Finished loading neighborhood file:');
            for (var i = 0; i < files.length; i++) {
                console.log('      - ' + path.basename(files[i]));
            };
            if (argv.mongodb) {
                processForMongodb();
            } else {
                getSvgs(svgPath);
            }
        });
}

function processForMongodb() {
    var mongoUrl = argv.mongodb;
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            var resultCounter = 0;
            var collection = db.collection(argv.collection);
            collection.find({}).toArray(function(err, results) {
                var unknownWayLocations = [];
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    var nodes = result.nodes;
                    var neighborhoodName;
                    for (var node in nodes) {
                        var coordinate = [nodes[node].lon, nodes[node].lat];
                        neighborhoodName = getNeighborhoodName(coordinate, allNeighborhoods);

                        console.log('');
                        console.log('Way at ' + coordinate[0] + ',' + coordinate[1]);
                        if (neighborhoodName != null) {
                            resultCounter++;
                            console.log('   Located in ' + neighborhoodName);
                            result.tags.neighborhood = neighborhoodName;
                            collection.update({ _id: result["_id"] }, result);
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
                console.log('(wait for it to close, this might take a few seconds/minutes)');
                console.log('');
                console.log('-----');

            })
        }
    });
}

function generateSvg(svgFile, neighborhoods, callback) {
    fs.readFile(svgFile, function(err, data) {
        parser.parseString(data, function(err, result) {
            if (err) {
                console.log(err);
            };
            var output = result;
            var polygons = result.svg.polygon;
            iterateOverPolygons(polygons, neighborhoods);

            //output.polygon = polygons;
            var xml = builder.buildObject(output);
            xml = xml.replace('<root>\n  ', '');
            xml = xml.replace('\n</root>', '');
            saveSvg(svgFile, xml);
        });
    });
}

function saveSvg(svgFile, xml) {
    var fileName = path.basename(svgFile);
    var exportPath = path.join('export', fileName);
    exportPath = path.join(__dirname, exportPath);

    fs.writeFile(exportPath, xml, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Svg has been saved: ' + fileName);
        }
    });
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log("  HOW TO RUN  ");
    console.log('--------------');
    console.log('About:');
    console.log('  This script iterates over a collection/svg and adds neighborhood information to it. Run for every mobility type separately (streets, biketracks, railtracks, railtracksparking)');
    console.log('');
    console.log('For svg:');
    console.log("  node index.js --svg yourSvgFile.svg --neighborhoods location/of/neighborhoods/geojsons");
    console.log('');
    console.log('For mongodb:');
    console.log("  node index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --neighborhoods neighborhoodsGeojson.json --collection streets");
    console.log('');
    console.log("  - svg:           [For parking spaces] The svg file you want to be altered. Needs to contain the 'moovel_centroidlatlon' meta tag");
    console.log("  - mongodb:       [For ways] The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin");
    console.log("  - collection:    [Only for mongodb] Name of the collection which should be queried");
    console.log("  - neighborhoods: [Necessary] A geojson containing the polygons for the neighborhoods, or a directory containing multiple geojsons");
    console.log('');
    console.log('Exiting now!');
    console.log('');
}

function getNeighborhoodName(coordinate, allNeighborhoods) {
    var point = turf.point(coordinate);

    for (var n = 0; n < allNeighborhoods.length; n++) {
        var neighborhoods = allNeighborhoods[n];
        for (var j = 0; j < neighborhoods.length; j++) {
            var neighborhood = neighborhoods[j];
            var geometryType = neighborhood.geometry.type;
            if (geometryType == 'Polygon' || geometryType == 'MultiPolygon') { //a fix that I can't write proper Overpass Queries
                if (geometryType == 'Polygon') {
                    var neighborhoodsPolygon = turf.polygon(neighborhood.geometry.coordinates);
                } else {
                    var neighborhoodsPolygon = turf.multiPolygon(neighborhood.geometry.coordinates);
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
    };
    return null;
}

function iterateOverPolygons(polygons, allNeighborhoods) {
    var resultCounter = 0;
    var unknownParkingSpotLocations = [];
    for (var i = 0; i < polygons.length; i++) {
        var polygon = polygons[i].$;
        var centroid = polygon.moovel_centroidlatlon.split(',');
        centroid[0] = parseFloat(centroid[0]);
        centroid[1] = parseFloat(centroid[1]);
        console.log('');
        console.log('Parking space at ' + centroid[0] + ',' + centroid[1]);

        var neighborhoodName = getNeighborhoodName(centroid, allNeighborhoods);
        if (neighborhoodName != null) {
            resultCounter++;
            polygon.moovel_neighborhood = neighborhoodName;
            console.log('   Located in ' + neighborhoodName);
        } else {
            console.log('   No matching neighborhood found :(');
            unknownParkingSpotLocations.push(polygon);
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
        var polygon = unknownParkingSpotLocations[i];
        var centroid = polygon.moovel_centroidlatlon.split(',');
        console.log('   ' + i + ': LatLon ' + centroid[1] + ',' + centroid[0] + ' (Id: ' + polygon.id + ')');
    };
}