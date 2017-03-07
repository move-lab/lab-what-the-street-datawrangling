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
var defaultWidthInPixels = 592;
var widthInMeter;
var defaultWidthInMeter = defaultWidthInPixels * 1.2672955975; //value was measured
var gapBetweeStreets; //in km
var defaultGapBetweeStreets = 0.005;

var onStreetParkingSpots;
var onStreetParkingSpotsDefault = 0;
var onStreetParking;

var sizePerParkingSpot = 12; //m2

var debugLimitStreets;
var defaultDebugLimitStreets = null;
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
var strokeWidthDefault = 17;


var counter = 0;
var numberOfFiles;

var jsonToSave = [];
var pretty;

main();

function main() {
    printInstructions();

    if (argv.parkingSvgHeight && argv.parkingArea && argv.mongodb && argv.collection) {
        // Use car svg as reference
        mongodbIn = argv.mongodbIn || argv.mongodb;
        
        if (argv.mongodbOut) {
            mongodbOut = argv.mongodbOut;
        }else{
            mongodbOut = (argv.mongodb).replace('_derived', '_coiled');
        }

        strokeWidth = argv.strokeWidth || strokeWidthDefault;
        strokeColor = argv.strokeColor || strokeColorDefault;
        collectionNameIn = argv.collectionIn || argv.collection;
        collectionNameOut = argv.collectionOut || argv.collection || collectionNameIn;
        parkingSvgHeight = argv.parkingSvgHeight;
        parkingArea = argv.parkingArea;
        onStreetParkingSpots = argv.parkingSpots || onStreetParkingSpotsDefault;
        onStreetParking = onStreetParkingSpots * sizePerParkingSpot;
        widthInMeter = argv.widthInMeter || defaultWidthInMeter;
        widthInPixels = argv.widthInPixels || defaultWidthInPixels;
        gapBetweeStreets = argv.gapBetweeStreets || defaultGapBetweeStreets;
        debugLimitStreets = argv.debugLimitStreets || defaultDebugLimitStreets;
        pretty = argv.pretty || true;

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
                                async.detectSeries([docs], coilStreets, function(err, result) {
                                    printSummary();
                                    dbIn.close();
                                    dbOut.close();
                                });
                            }
                        });
                    }
                });
            }
        });
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
    console.log('   - gapBetweeStreets: ' + gapBetweeStreets);
    console.log('   - pretty: ' + pretty);
    if (debugLimitStreets === null) {
        console.log('   - debugLimitStreets: no');
    } else {
        console.log('   - debugLimitStreets to ' + debugLimitStreets);
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
    console.log('   All streets were successfully coiled and exported');
    console.log('   svg will be exported to /export/{collectionName}.svg');
    console.log('   data was added to your specified mongoDB');
    console.log();
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('   node --max_old_space_size=8192 index.js --parkingSpots 103210 --parkingSvgHeight 20584 --parkingArea 8156098.06 --mongodbIn mongodb://127.0.0.1:27017/berlin_derived --collection streets --mongodbOut mongodb://127.0.0.1:27017/berlin_coiled');
    console.log();
    console.log('   Important!');
    console.log('   You might have to adjust the size of the strokeWidth. Best is to make a first try using --debugLimitStreets (something like 300) and look at the svg. It should be clearly a coil with little gaps between each slope (if it is not like that sometimes, that is ok), but if most overlap, adjust the stroke width size.');
    console.log();
    console.log('   --parkingSvgHeight: The height of the packed parking spaces ...');
    console.log('   --parkingArea: ... and their area (see citymetadata) (this is used to define the scale)');
    console.log('   --collection: The name of the collection you want to get information from and also save to');
    console.log('   --mongodb: The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (it will expect a db ending with _derived as input and will out the same name but ending with _coiled)');
    console.log();
    console.log('   --strokeWidth: [optional] Defines the stroke width of the generated coils - defaults to ' + strokeWidthDefault);
    console.log('   --strokeColor: [optional] The color of the coiled streets/rails - defaults to ' + strokeColorDefault);
    console.log('   --mongodbIn: [optional] The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb)');
    console.log('   --mongodbOut: [optional] The connection to the export mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin (defaults to --mongodb and changes the suffix)');
    console.log('   --collectionIn: [optional] The name of the collection you want to get information from defaults to --collection');
    console.log('   --collectionOut: [optional] The name of the collection you want to output to - defaults to the same name as --collection --collectionIn');
    console.log('   --parkingSpots: [optional] Number of on street parking spots (take from citymetadata.json) - defaults to ' + onStreetParkingSpotsDefault);
    console.log('   --widthInMeter: [optional] Width of the street coil in meters (scale) - default: ' + defaultWidthInMeter);
    console.log('   --widthInPixels: [optional] Width of the street coil in pixels (scale) - default: ' + defaultWidthInPixels);
    console.log('   --gapBetweeStreets: [optional] Gap between the individual streets in km - default: ' + defaultGapBetweeStreets);
    console.log('   --debugLimitStreets: [Debug] Limit how many streets should get coiled');
    console.log();
    console.log('   Note: Run with more RAM allocation (--max_old_space_size=8192)');
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
        lengthInM += gapBetweeStreets * 1000;
        entireArea += street.tags.area;
        if (i > debugLimitStreets && debugLimitStreets != null) {
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
        var coiledStreet = coil.getCoiledStreet(vectorStreetDivided, positionOnCoilCounter, 150, 5);
        positionOnCoilCounter += (coiledStreet.coilEnd - coiledStreet.coilStart)
        positionOnCoilCounter += gapBetweeStreets;

        coiledStreets.push(coiledStreet);
        //vectorStreets.push( vectorStreetDivided );

        if (i > debugLimitStreets && debugLimitStreets != null) {
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

        // Store
        var toPush = {
            '_id': coiledStreet['_id'],
            'properties': {
                'name': coiledStreet.tags.name,
                'length': coiledStreet.tags.length,
                'area': coiledStreet.tags.area,
                'origin': coiledStreet.origin
            },
            'coiled': coiledStreetToPush,
            'original': vectorStreetDividedToPush
        };

        if (coiledStreet.tags.neighborhood) {
            toPush.properties.neighborhood = coiledStreet.tags.neighborhood;
        };

        jsonToSave.push(toPush);
        if (debugLimitStreets === null) {
            stdout('      Coiling ' + (i + 1) + '/' + numberOfStreets);
        } else {
            stdout('      Coiling ' + (i + 1) + '/' + debugLimitStreets + ' [Debug Mode]');
        }
    };
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
        var piece = jsonToSave[i]
        stdout('      Storing Street ' + (i + 1) + '/' + numberOfPieces);
        collectionOut.insert(piece);
    };
    stdout('      Done');

    // Save svg
    console.log();
    console.log();
    console.log('   6. Saving Svg');
    var wstream2 = fs.createWriteStream(saveAs + '.svg');
    var svgPieces = coil.generateSvgPieces(coiledStreets, meterPerPixel, parkingSvgHeight, strokeColor, strokeWidth);
    var numberOfSvgPieces = svgPieces.length;
    for (var i = 0; i < numberOfSvgPieces; i++) {
        stdout('      Saving Path ' + (i + 1) + '/' + numberOfSvgPieces);
        wstream2.write(svgPieces[i] + '\n');
    }
    wstream2.end();
    stdout('      Done');
    callback();
}