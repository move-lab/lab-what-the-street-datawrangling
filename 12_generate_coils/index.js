var fs = require('fs');
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
var defaultWidthInPixels = 588;
var meterPerPixel;
var defaultMeterPerPixel = 1.2672955975;
var widthInMeter;
var defaultWidthInMeter = defaultWidthInPixels * defaultMeterPerPixel; //value was measured
var gap;
var gapPercentage;
//var defaultGapPercentage = 0.015;
var defaultGapPercentage = 0;
var damping;
//var dampingDefault = 170;

var adaptSize;
var adaptSizeDefault = 1;

var adaptiveStroke = true;

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
var strokeWidthDefault = {
    'streets': 11,
    'railtracks': 5,
    'railtracksparking': 5,
    'biketracks': 5
};

var fileNameLUT = {
    'streets': 'car-tracks',
    'railtracks': 'rail-tracks',
    'railtracksparking': 'rail-parking',
    'biketracks': 'bike-tracks'
}

var dampingDefault = {
    'streets': 1000,
    'railtracks': 1000,
    'railtracksparking': 700,
    'biketracks': 1000
}

var mobilityType = {
    'streets': 'car',
    'railtracks': 'rail',
    'railtracksparking': 'rail',
    'biketracks': 'bike'
}


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

        adaptSize = argv.adaptSize || adaptSizeDefault;

        alternatingStrokeColor = argv.alternatingStrokeColor || false;
        collectionNameIn = argv.collectionIn || argv.collection;
        collectionNameOut = argv.collectionOut || argv.collection || collectionNameIn;

        strokeWidth = argv.strokeWidth || strokeWidthDefault[collectionNameIn];
        strokeColor = argv.strokeColor || strokeColorDefault;

        parkingSvgHeight = argv.parkingSvgHeight;
        parkingArea = argv.parkingArea;

        widthInPixels = argv.widthInPixels || defaultWidthInPixels;
        widthInPixels -= strokeWidth; //so all coils are the same width regardless of thickness

        meterPerPixel = argv.meterPerPixel || defaultMeterPerPixel;
        widthInMeter = meterPerPixel*widthInPixels;

        gapPercentage = argv.gap || defaultGapPercentage;
        gap = calculateGap();
        limit = argv.limit || defaultLimit;
        onStreetParkingSpots = argv.parkingSpots || onStreetParkingSpotsDefault;

        pretty = argv.pretty || true;

        damping = argv.damping || dampingDefault[collectionNameIn];
        damping = Number(damping);

        if (isNaN(damping)) {
            throw 'please only specify one damping value and use a number'
        }

        saveSettings();

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

function calculateGap(){
    return (widthInMeter * gapPercentage + strokeWidth * meterPerPixel * 1.2) / 1000;
}

function getCityName() {
    var pathPieces = mongodbIn.split('/');
    var cityName = pathPieces[pathPieces.length - 1];
    cityName = cityName.replace('_derived', '');
    return cityName;
}

function getTimeStamp() {
    return Math.round(new Date().getTime() / 1000)
}

function saveSettings() {
    var settings = '';
    settings += ' --mongodb ' + mongodbIn;
    settings += ' --collection ' + collectionNameIn;
    settings += ' --parkingArea ' + parkingArea;
    settings += ' --parkingSvgHeight ' + parkingSvgHeight;

    if (gapPercentage !== defaultGapPercentage) {
        settings += ' --gap ' + gap;
    }

    if (widthInPixels !== defaultWidthInPixels) {
        settings += ' --widthInPixels ' + widthInPixels;
    }

    if (widthInMeter !== defaultWidthInMeter) {
        settings += ' --widthInMeter ' + widthInMeter;
    }

    // if (damping !== dampingDefault) {
    //     settings += ' --damping ' + damping;
    // }

    if (strokeColor !== strokeColorDefault) {
        settings += ' --strokeColor ' + strokeColor;
    }

    if (strokeWidth !== strokeWidthDefault) {
        settings += ' --strokeWidth ' + strokeWidth;
    }

    if (alternatingStrokeColor !== false) {
        settings += ' --alternatingStrokeColor ' + alternatingStrokeColor;
    }

    if (limit !== null) {
        settings += ' --limit ' + limit;
    }

    if (onStreetParkingSpots !== 0) {
        settings += ' --onStreetParkingSpots ' + onStreetParkingSpots;
    }

    var fileName = 'settings_' + collectionNameIn + '.txt';

    var dir = path.join(__dirname, 'export', getCityName());
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var saveAs = path.join(__dirname, 'export', getCityName(), fileName);
    fs.writeFile(saveAs, settings, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

function printSummary() {
    console.log();
    console.log();
    console.log('--------------');
    console.log('   COMPLETE      ');
    console.log('--------------');
    console.log();
    console.log('   All streets/rails were successfully coiled and exported (see export folder and {city}_coiled mongodb)');
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
    console.log('     node --max_old_space_size=8192 index.js --parkingSvgHeight 20584 --parkingArea 8156098.06 --mongodb mongodb://127.0.0.1:27017/berlin_derived --collection streets --meterPerPixel 1.2672955975');
    console.log();
    console.log('   Note: There are many settings to define the coil, but what you have to do essentially is:');
    console.log('      1. Open the readme');
    console.log('      2. Go to "Commands to run"');
    console.log('      3. Run every command after each other listed there');
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
        street.tags.area = street.tags.area * adaptSize;

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

    //saveStats(lengthInM, entireArea, coilHeightInPixels);

    console.log('      Done');
    console.log('      - Length: ' + lengthInM + ' m');
    console.log('      - Area: ' + entireArea + ' m2');
    console.log('      - Coil Height: ' + coilHeightInPixels + ' px');


    console.log();
    console.log('   4. Coiling');
    var coiledStreets = [];
    //var vectorStreets = [];
    var positionOnCoilCounter = 0;
    var numberOfStreets = streets.length;
    coil.setProperties(widthInMeter, 5);

    var numberOfHorizontalLines = lengthInM/widthInMeter;

    if (adaptiveStroke) {
        strokeWidth = coilHeightInPixels/numberOfHorizontalLines - 2;
        gap = calculateGap();
    };
    //console.log(numberOfHorizontalLines);

    var properties = coil.setHeight(coilHeightInPixels, lengthInM, pixelPerMeter);

    // Coil
    for (var i = 0; i < numberOfStreets; i++) {
        if (i > limit - 1 && limit != null) {
            break;
        }

        var street = streets[i];

        var vectorStreet = unfold.getStreetWithVectors(street);
        var vectorStreetDivided = unfold.subdivideVectorStreet(vectorStreet, 1);
        var coiledStreet = coil.getCoiledStreet(vectorStreetDivided, positionOnCoilCounter, damping, 5);
        //console.log(vectorStreetDivided);
        // for (var i = 0; i < vectorStreetDivided.vectors.length; i++) {
        //     console.log(vectorStreetDivided.vectors[i]);
        // };

        positionOnCoilCounter += (coiledStreet.coilEnd - coiledStreet.coilStart)
        positionOnCoilCounter += gap;

        coiledStreets.push(coiledStreet);
        //vectorStreets.push( vectorStreetDivided );

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


    var name = fileNameLUT[collectionNameIn];
    var saveAs = path.join(__dirname, 'export', getCityName(), name + '.svg');
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
        stdout('      Storing ' + (i + 1) + '/' + numberOfPieces);
        collectionOut.insert(piece);
    };
    stdout('      Done');

    // Save svg
    console.log();
    console.log();
    console.log('   6. Saving Svg');
    var wstream2 = fs.createWriteStream(saveAs);
    var svgWidth = widthInPixels + 20;
    var svgHeight = coilHeightInPixels + 40;
    var svgPieces = coil.generateSvgPieces(coiledStreets, meterPerPixel, svgWidth, strokeColor, strokeWidth);
    var numberOfSvgPieces = svgPieces.length;
    for (var i = 0; i < numberOfSvgPieces; i++) {
        stdout('      Saving Path ' + (i + 1) + '/' + numberOfSvgPieces);
        wstream2.write(svgPieces[i] + '\n');
    }
    wstream2.end();
    stdout('      Done');
    callback();
}

function saveStats(lengthInM, entireArea, coilHeightInPixels) {
    var output = '';
    output += '"' + mobilityType[collectionNameIn] + '": {\n';
    output += '    "area": ' + Math.round(entireArea*100)/100 + ',\n';
    output += '    "length": ' + Math.round(lengthInM)/100 + ',\n';
    output += '    "svgHeight": ' + Math.round(coilHeightInPixels)/100 + '\n';
    output += '}';
    var fileName = 'stats_' + collectionNameIn + '.js';
    var saveAs = path.join(__dirname, 'export', getCityName(), fileName);
    fs.writeFile(saveAs, output, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

function getCityName() {
    var pathPieces = mongodbIn.split('/');
    var cityName = pathPieces[pathPieces.length - 1];
    cityName = cityName.replace('_derived', '');
    return cityName;
}