var fs = require('fs');
//var dir = require('node-dir');
var turf = require('turf');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var mongodb = require('mongodb');
require('../lib/helpers.js');
require('../lib/coil.js');
require('../lib/unfold.js');

var MongoClient = mongodb.MongoClient;

var widthInPixels;
var defaultWidthInPixels = 570;
var widthInMeter;
var defaultWidthInMeter = defaultWidthInPixels * 1.2672955975; //value was measured
var gap; //in km
var defaultGap = 0.002;

var damping;
var dampingDefault = 170;

var onStreetParkingSpots;
var onStreetParkingSpotsDefault = 0;
var onStreetParking;

var numberOfAllStreets;
var additionalSpacePerStreet;

var sizePerParkingSpot = 12; //m2

var limit;
var defaultLimit = null;
var parkingSvgHeight;
var mongodbIn;
var mongodbOut;
var collectionNameIn;
var collectionNameOut;
var parkingArea;
var dbOut;

var strokeColor;
var strokeColorDefault = '#6566CC';

var strokeWidth;
var strokeWidthDefault = 13;


var counter = 0;
var numberOfFiles;

var jsonToSave = [];
var pretty;

main();

function main() {
    printInstructions();

    if (argv.parkingSvgHeight && argv.parkingArea && (argv.mongodb || (argv.mongodbIn && argv.mongodbOut)) && argv.collection) {
        // Use car svg as reference
        mongodbIn = argv.mongodbIn || argv.mongodb;

        if (argv.mongodbOut) {
            mongodbOut = argv.mongodbOut;
        } else {
            mongodbOut = (argv.mongodb).replace('_derived', '_coiled') || (argv.mongodbIn).replace('_derived', '_coiled');
        }

        strokeWidth = argv.strokeWidth || strokeWidthDefault;
        strokeColor = argv.strokeColor || strokeColorDefault;
        collectionNameIn = argv.collectionIn || argv.collection;
        collectionNameOut = argv.collectionOut || argv.collection || collectionNameIn;
        parkingSvgHeight = argv.parkingSvgHeight;
        parkingArea = argv.parkingArea;
        
        widthInMeter = argv.widthInMeter || defaultWidthInMeter;
        widthInPixels = argv.widthInPixels || defaultWidthInPixels;
        gap = argv.gap || defaultGap;
        limit = argv.limit || defaultLimit;
        onStreetParkingSpots = argv.parkingSpots || onStreetParkingSpotsDefault;

        pretty = argv.pretty || true;

        damping = argv.damping || dampingDefault;

        printActiveSettings();
        printProgressStart();

        console.log();
        console.log('   1. Connect to mongoDB for importing');
        stdout('      Connecting');
        MongoClient.connect(mongodbIn, function(err, dbIn) {
            if (err) {
                console.log('Unable to connect to ' + mongodbIn + '. Error:', err);
            } else {
                stdout('      Done');

                console.log();
                console.log();
                console.log('   2. Connect to mongoDB for exporting');
                stdout('      Connecting');
                MongoClient.connect(mongodbOut, function(err, dbOutTemp) {
                    dbOut = dbOutTemp;
                    if (err) {
                        console.log('Unable to connect to ' + mongodbOut + '. Error:', err);
                    } else {
                        stdout('      Done');
                        var collectionIn = dbIn.collection(collectionNameIn);
                        collectionIn.find({}).toArray(function(err, docs) {
                            if (err) {
                                console.log('ERR', err);
                            } else {
                                numberOfAllStreets = docs.length;
                                if (limit !== null) {
                                    onStreetParkingSpots = onStreetParkingSpots * limit / numberOfAllStreets;
                                }
                                onStreetParking = onStreetParkingSpots * sizePerParkingSpot;
                                additionalSpacePerStreet = onStreetParking / numberOfAllStreets;
                                async.detectSeries([docs], coilStreets, function(err, result) {
                                    console.log();
                                    console.log('   Waiting for db to finish ... ');
                                    setTimeout(function() {
                                        dbIn.close();
                                        dbOut.close();

                                        printSummary();
                                    }, 20000)
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        console.log();
        console.log('Please specify all required parameters');
    }
}

function printActiveSettings() {
    console.log();
    console.log('--------------');
    console.log('   SETTINGS      ');
    console.log('--------------');
    console.log();
    console.log('   - widthInMeter: ' + widthInMeter);
    console.log('   - parkingSvgHeight: ' + parkingSvgHeight);
    console.log('   - parkingArea: ' + parkingArea);
    console.log('   - widthInPixels: ' + widthInPixels);
    console.log('   - gap: ' + gap);
    console.log('   - pretty: ' + pretty);
    if (limit === null) {
        console.log('   - limit: no');
    } else {
        console.log('   - limit to ' + limit);
    }
    console.log();
}

function printSummary() {
    console.log();
    console.log();
    console.log('--------------');
    console.log('   COMPLETE      ');
    console.log('--------------');
    console.log();
    console.log('   All streets/rails were successfully coiled and exported');
    console.log('   - svg will be exported to /export/{collectionName}.svg');
    console.log('   - data was added to your specified mongoDB');
    console.log();
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('      ABOUT  ');
    console.log('--------------');
    console.log('');
    console.log('   This script coils the streets/rails, exports them as svg and stores the coiling properties into a mongoDB – you have to run this script for every type of mobility');
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('     node --max_old_space_size=8192 index.js --parkingSpots 103210 --parkingSvgHeight 20584 --parkingArea 8156098.06 --mongodb mongodb://127.0.0.1:27017/berlin_derived --collection streets');
    console.log();
    console.log('   Note:');
    console.log('     - You might have to adjust the size of the strokeWidth. Best is to make a first try using --limit (something like 300) and look at the svg.');
    console.log('       It should be clearly a coil with little gaps between each slope (if it is not like that sometimes, that is ok), but if most overlap, adjust the stroke width size.');
    console.log('     - if the coil is too messy or too clean, you can also play with the damping value (see below)');
    console.log('     - Define parkingSpots only when using coiling streets for cars');
    console.log('     - Run with more RAM allocation (--max_old_space_size=8192) as in the example');
    console.log();
    console.log('   Settings per city:');    
    console.log('     --parkingSvgHeight: The height of the packed parking spaces');
    console.log('     --parkingArea: ... and their area (see citymetadata)');
    console.log('       Those two parameters define the scale of m per px, so one setting works for all types of mobility');
    console.log('     --mongodb: The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
    console.log('       (it will expect a db ending with _derived as input and will out the same name but ending with _coiled)');
    console.log();
    console.log('   Settings per form of mobility:');
    console.log('     --collection: The name of the collection you want to get information from and also save to');
    console.log('     --damping: [Optional] The amount of damping (around 100 [little damped] - 200 [damped a lot]).');
    console.log('       You might have to tweak this for the different mobility types - defaults to ' + dampingDefault + ' which works nicely with streets');
    console.log('     --gap: [optional] Gap between the individual streets/rails in km - default: ' + defaultGap);
    console.log('     --strokeWidth: [optional] Defines the stroke width of the generated coils - defaults to ' + strokeWidthDefault);
    console.log();
    console.log('   Extra Settings when coiling streets for cars:');
    console.log('     --parkingSpots: [optional] Number of on street parking spots (take from citymetadata.json) - defaults to ' + onStreetParkingSpotsDefault);
    console.log();
    console.log('   Debug Options:');
    console.log('     --limit: [Debug] Limit how many streets/rails should get coiled');
    console.log();
    console.log('   More options (which by default you will not have to use):');
    console.log('     --strokeColor: [optional] The color of the coiled streets/rails - defaults to ' + strokeColorDefault);
    console.log('     --mongodbIn: [optional] The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb)');
    console.log('     --mongodbOut: [optional] ... export mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb and changes the suffix)');
    console.log('     --collectionIn: [optional] The name of the collection you want to get information from defaults to --collection');
    console.log('     --collectionOut: [optional] The name of the collection you want to output to - defaults to the same name as --collection --collectionIn');
    console.log('     --widthInMeter: [optional] Width of the street coil in meters (scale) - default: ' + defaultWidthInMeter);
    console.log('     --widthInPixels: [optional] Width of the street coil in pixels (scale) - default: ' + defaultWidthInPixels);
    console.log();
}

function stdout(str) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(str);
}

function stdoutappend(str) {
    process.stdout.write(str);
}

function printProgressStart() {
    console.log();
    console.log('--------------');
    console.log('   PROGRESS      ');
    console.log('--------------');
}

function coilStreets(data, callback) {
    var streets = data;

    // Get Area and length
    console.log();
    console.log();
    console.log('   3. Getting Length and Area');
    var lengthInM = 0;
    var entireArea = 0;
    for (var i = 0; i < streets.length; i++) {
        var street = streets[i];
        lengthInM += street.tags.length;
        lengthInM += gap * 1000;
        entireArea += street.tags.area;
        if (i > limit && limit != null) {
            break;
        }
    }

    entireArea += onStreetParking;
    meterPerPixel = widthInMeter / widthInPixels;
    pixelPerMeter = widthInPixels / widthInMeter;
    var coilHeightInPixels = entireArea / parkingArea * parkingSvgHeight;

    console.log('      Done');
    console.log('      - Length: ' + lengthInM + ' m');
    console.log('      - Area: ' + entireArea + ' m2');
    console.log('      - Coil Height: ' + coilHeightInPixels + ' px');


    console.log();
    console.log('   4. Coiling Streets');
    var coiledStreets = [];
    //var vectorStreets = [];
    var positionOnCoilCounter = 0;
    var numberOfStreets = streets.length;
    coil.setProperties(widthInMeter, 5);
    var properties = coil.setHeight(coilHeightInPixels, lengthInM, pixelPerMeter);

    // Coil
    for (var i = 0; i < numberOfStreets; i++) {
        var street = streets[i];

        var vectorStreet = unfold.getStreetWithVectors(street);
        var vectorStreetDivided = unfold.subdivideVectorStreet(vectorStreet, 1);
        var coiledStreet = coil.getCoiledStreet(vectorStreetDivided, positionOnCoilCounter, damping, 5);
        positionOnCoilCounter += (coiledStreet.coilEnd - coiledStreet.coilStart)
        positionOnCoilCounter += gap;

        coiledStreets.push(coiledStreet);
        //vectorStreets.push( vectorStreetDivided );

        if (i > limit && limit != null) {
            break;
        }

        // Remove Redundancy
        var coiledStreetToPush = JSON.parse(JSON.stringify(coiledStreet));
        delete coiledStreetToPush.tags;
        delete coiledStreetToPush.length;
        delete coiledStreetToPush['_id'];
        delete coiledStreetToPush.subVectors;
        delete coiledStreetToPush.originalLengths;
        delete coiledStreetToPush.origin;

        var vectorStreetDividedToPush = JSON.parse(JSON.stringify(vectorStreetDivided));
        delete vectorStreetDividedToPush.tags;
        delete vectorStreetDividedToPush['_id'];
        delete vectorStreetDividedToPush.length;
        delete vectorStreetDividedToPush.coilEnd;
        delete vectorStreetDividedToPush.coilStart;
        delete vectorStreetDividedToPush.subVectors;
        delete vectorStreetDividedToPush.originalLengths;
        delete vectorStreetDividedToPush.totalVariation;
        delete vectorStreetDividedToPush.origin;

        coiledStreet.tags.area += additionalSpacePerStreet;

        // Store
        var toPush = {
            '_id': coiledStreet['_id'],
            'properties': {
                'length': coiledStreet.tags.length.toFixed(2),
                'area': coiledStreet.tags.area.toFixed(2),
                'origin': coiledStreet.origin
            },
            'coiled': coiledStreetToPush,
            'original': vectorStreetDividedToPush
        }

        if (coiledStreet.tags.neighborhood) {
            toPush.properties.neighborhood = coiledStreet.tags.neighborhood;
        }

        if (coiledStreet.tags.name) {
            toPush.properties.name = coiledStreet.tags.name;
        }

        jsonToSave.push(toPush);
        if (limit === null) {
            stdout('      Coiling ' + (i + 1) + '/' + numberOfStreets);
        } else {
            stdout('      Coiling ' + (i + 1) + '/' + limit + ' [Debug Mode]');
        }
    }
    stdout('      Done');


    var name = collectionNameIn;
    var saveAs = path.join(__dirname, "export", name);
    var prettyA = null;
    var prettyB = 4;

    if (pretty == false) {
        prettyA = null;
        prettyB = null;
    }

    console.log();
    console.log();
    console.log('   5. Adding Data to mongoDB');

    var numberOfPieces = jsonToSave.length;

    var collectionOut = dbOut.collection(collectionNameOut);
    collectionOut.drop();

    for (var i = 0; i < numberOfPieces; i++) {
        var piece = jsonToSave[i];
        stdout('      Storing Street ' + (i + 1) + '/' + numberOfPieces);
        collectionOut.insert(piece);
    };
    stdout('      Done');

    // Save svg
    console.log();
    console.log();
    console.log('   6. Saving Svg');
    var wstream2 = fs.createWriteStream(saveAs + '.svg');
    var svgWidth = widthInPixels + 40;
    var svgHeight = coilHeightInPixels + 40;
    var svgPieces = coil.generateSvgPieces(coiledStreets, meterPerPixel, svgWidth, strokeColor, strokeWidth, coiledStreet.tags.name || null, coiledStreet.tags.neighborhood || null);
    var numberOfSvgPieces = svgPieces.length;
    for (var i = 0; i < numberOfSvgPieces; i++) {
        stdout('      Saving Path ' + (i + 1) + '/' + numberOfSvgPieces);
        wstream2.write(svgPieces[i] + '\n');
    }
    wstream2.end();
    stdout('      Done');
    callback();
}