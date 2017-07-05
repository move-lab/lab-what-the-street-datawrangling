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

var pretty;

var cityData = {
    "berlin": {
        "meterPerPixel": 1.01,
        "parkingSvgHeight": 20584,
        "parkingArea": 8156098.06
    },
    "newyork": {
        "meterPerPixel": 1.27,
        "parkingSvgHeight": 9758,
        "parkingArea": 6438190.23,
        "scale": {
            "car-tracks": 0.8
        }
    },
    "amsterdam": {
        "meterPerPixel": 1.02,
        "parkingSvgHeight": 3715,
        "parkingArea": 1554865.52
    },
    "stuttgart": {
        "meterPerPixel": 1.1,
        "parkingSvgHeight": 3600,
        "parkingArea": 2071356.74
    },
    "portland": {
        "meterPerPixel": 1.17,
        "parkingSvgHeight": 6016,
        "parkingArea": 3256151.8
    },
    "losangeles": {
        "meterPerPixel": 1.38,
        "parkingSvgHeight": 14180,
        "parkingArea": 10718240.39
    },
    "sanfrancisco": {
        "meterPerPixel": 1.36,
        "parkingSvgHeight": 2546,
        "parkingArea": 1644303.24,
        "scale": {
            "car-tracks": 0.7,
            "bike-tracks": 0.7
        }
    },
    "boston": {
        "meterPerPixel": 1.23,
        "parkingSvgHeight": 1695,
        "parkingArea": 1016707.35,
        "scale": {
            "car-tracks": 0.5
        }
    },
    "vienna": {
        "meterPerPixel": 1.11,
        "parkingSvgHeight": 6987,
        "parkingArea": 3246050.9,
        "scale": {
            "bike-tracks": 0.8
        }
    },
    "copenhagen": {
        "meterPerPixel": 0.94,
        "parkingSvgHeight": 3959,
        "parkingArea": 1300246.11,
        "scale": {
            "car-tracks": 0.5
        }
    },
    "barcelona": {
        "meterPerPixel": 1.25,
        "parkingSvgHeight": 1371,
        "parkingArea": 848626.92
    },
    "beijing": {
        "meterPerPixel": 1.28,
        "parkingSvgHeight": 3207,
        "parkingArea": 2177509.53
    },
    "budapest": {
        "meterPerPixel": 1.13,
        "parkingSvgHeight": 6693,
        "parkingArea": 3289634.03
    },
    "chicago": {
        "meterPerPixel": 1.24,
        "parkingSvgHeight": 23527,
        "parkingArea": 14619593.73,
        "scale": {
            "bike-tracks": 0.5
        }
    },
    "helsinki": {
        "meterPerPixel": 0.83,
        "parkingSvgHeight": 9326,
        "parkingArea": 2427001.99,
        "scale": {
            "car-tracks": 0.9
        }
    },
    "hongkong": {
        "meterPerPixel": 1.41,
        "parkingSvgHeight": 1992,
        "parkingArea": 1793753.56
    },
    "jakarta": {
        "meterPerPixel": 1.66,
        "parkingSvgHeight": 4487,
        "parkingArea": 1366919.62,
        "scale": {
            "car-tracks": 0.8,
            "rail-tracks": 0.8,
            "rail-parking": 0.8,
            "bike-tracks": 0.6
        }
    },
    "johannesburg": {
        "meterPerPixel": 1.5,
        "parkingSvgHeight": 4487,
        "parkingArea": 3749097.91
    },
    "london": {
        "meterPerPixel": 1.04,
        "parkingSvgHeight": 25822,
        "parkingArea": 11001870.06
    },
    "moscow": {
        "meterPerPixel": 0.94,
        "parkingSvgHeight": 26866,
        "parkingArea": 9554779.18,
        "scale": {
            "car-tracks": 0.8
        }
    },
    "rome": {
        "meterPerPixel": 1.24,
        "parkingSvgHeight": 8655,
        "parkingArea": 5068537.63
    },
    "singapore": {
        "meterPerPixel": 1.67,
        "parkingSvgHeight": 4174,
        "parkingArea": 4227709.77
    },
    "tokyo": {
        "meterPerPixel": 1.36,
        "parkingSvgHeight": 9200,
        "parkingArea": 5951035.54
    }
}

var cities;
var citiesDefault = Object.keys(cityData);

cities = argv.cities || citiesDefault;
if (argv.cities) {
    cities = cities.split(',');
};

async.eachSeries(cities, function(automaticCityName, callback) {
    async.mapSeries(['biketracks', 'railtracks', 'railtracksparking', 'streets'],
        function(collName, callback) {
            console.log(automaticCityName, collName);
            main(automaticCityName, collName, callback)
        },
        function(err) {
            console.log(automaticCityName + ' complete');
            callback();
        }
    );
});

function main(automaticCityName, automaticCollection, callback) {
    console.log();
    console.log();
    console.log('Coiling ' + automaticCityName + ' (' + automaticCollection + ')')

    // Use car svg as reference
    mongodbIn = 'mongodb://127.0.0.1:27017/' + automaticCityName + '_derived';

    if (argv.mongodbOut) {
        mongodbOut = argv.mongodbOut;
    } else {
        mongodbOut = mongodbIn.replace('_derived', '_coiled') || (argv.mongodbIn).replace('_derived', '_coiled');
    }

    adaptSize = adaptSizeDefault;
    var mobilityName = fileNameLUT[automaticCollection];
    if (cityData[automaticCityName].scale && cityData[automaticCityName].scale[mobilityName]) {
        adaptSize = cityData[automaticCityName].scale[mobilityName];
        console.log('Scaling about ' + adaptSize);
    };

    alternatingStrokeColor = argv.alternatingStrokeColor || false;
    collectionNameIn = automaticCollection;
    collectionNameOut = argv.collectionOut || argv.collection || collectionNameIn;

    strokeWidth = argv.strokeWidth || strokeWidthDefault[collectionNameIn];
    strokeColor = argv.strokeColor || strokeColorDefault;

    parkingSvgHeight = cityData[automaticCityName].parkingSvgHeight;
    parkingArea = cityData[automaticCityName].parkingArea;

    widthInPixels = argv.widthInPixels || defaultWidthInPixels;
    widthInPixels -= strokeWidth; //so all coils are the same width regardless of thickness

    meterPerPixel = cityData[automaticCityName].meterPerPixel;
    widthInMeter = meterPerPixel * widthInPixels;

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
                //dbOut.collection(automaticCollection).drop(function() {
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
                                dbIn.close();
                                dbOut.close();

                                printSummary();
                                setImmediate(callback);
                            });
                        }
                    });
                }
                //});
            });
        }
    });
}

function calculateGap() {
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
    console.log('     node --max_old_space_size=8192 index.js --cities johannesburg,boston');
    console.log();
    console.log('    --cities: [Optional] ');
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
    var jsonToSave = [];
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
    //var coiledStreets = [];
    //var vectorStreets = [];
    var positionOnCoilCounter = 0;
    var numberOfStreets = streets.length;
    coil.setProperties(widthInMeter, 5);

    var numberOfHorizontalLines = lengthInM / widthInMeter;

    if (adaptiveStroke) {
        strokeWidth = coilHeightInPixels / numberOfHorizontalLines - 2;
        gap = calculateGap();
    }
    //console.log(numberOfHorizontalLines);

    var properties = coil.setHeight(coilHeightInPixels, lengthInM, pixelPerMeter);

    // Coil
    for (var streetIndex = 0; streetIndex < numberOfStreets; streetIndex++) {
        if (streetIndex > limit - 1 && limit != null) {
            break;
        }

        var street = streets[streetIndex];

        var vectorStreet = unfold.getStreetWithVectors(street);
        var vectorStreetDivided = unfold.subdivideVectorStreet(vectorStreet, 2);
        var coiledStreet = coil.getCoiledStreet(vectorStreetDivided, positionOnCoilCounter, damping, 5);
        //console.log(vectorStreetDivided);
        // for (var i = 0; i < vectorStreetDivided.vectors.length; i++) {
        //     console.log(vectorStreetDivided.vectors[i]);
        // };

        positionOnCoilCounter += (coiledStreet.coilEnd - coiledStreet.coilStart)
        positionOnCoilCounter += gap;

        // var coiledStreetToTest = JSON.parse(JSON.stringify(coiledStreet));
        // var coiledVectorsCompressed = [];
        // for (var i = 0; i < coiledStreetToTest.vectors.length; i++) {
        //     var val = coiledStreetToTest.vectors[i];
        //     var toP = [val.distance, val.deltaAngle];
        //     coiledVectorsCompressed.push(toP);
        // };
        // coiledStreetToTest.vectors = coiledVectorsCompressed;
        // coiledStreets.push(coiledStreetToTest);

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

        // Convert object to array to save space
        var coiledVectorsCompressed = [];
        for (var i = 0; i < coiledStreetToPush.vectors.length; i++) {
            var val = coiledStreetToPush.vectors[i];
            var toP = [val.distance, val.deltaAngle];
            coiledVectorsCompressed.push(toP);
        };
        coiledStreetToPush.vectors = coiledVectorsCompressed;

        var originalVectorsCompressed = [];
        for (var i = 0; i < vectorStreetDividedToPush.vectors.length; i++) {
            var val = vectorStreetDividedToPush.vectors[i];
            var type;
            if (val.type === 'street') {
                type = 1;
            } else {
                type = 0;
            }
            var toP = [val.distance, val.deltaBearing, type, val.originalNumber]
            originalVectorsCompressed.push(toP);
        };
        vectorStreetDividedToPush.vectors = originalVectorsCompressed;

        // For storing and editing
        var toPush = {
            '_id': coiledStreet['_id'],
            'properties': {
                'length': coiledStreet.tags.length.toFixed(2),
                'area': coiledStreet.tags.area.toFixed(2),
                'coilOrigin': coiledStreet.coilOrigin,
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
            stdout('      Coiling ' + (streetIndex + 1) + '/' + numberOfStreets);
        } else {
            stdout('      Coiling ' + (streetIndex + 1) + '/' + limit + ' [Debug Mode]');
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

    var collectionOut = dbOut.collection(collectionNameOut);
    collectionOut.drop(function() {

        async.eachSeries(jsonToSave, function(piece, callback) {
            stdout('      Storing data');
            collectionOut.save(piece, function(err, records) {
                if (err !== null) {
                    //var exportFailAs = path.join(__dirname, 'export', getCityName(), 'insertionFailed_' + collectionNameIn + '_' + piece._id + '.json');
                    //fs.writeFileSync(exportFailAs, JSON.stringify(piece, null, 4));
                    console.log('It looks like mongodb crashed when storing id ' + piece._id)
                }
                setImmediate(callback);
            });
        }, function(err, result) {
            stdout('      Done');

            // Save svg
            console.log();
            console.log();
            console.log('   6. Saving Svg');
            var wstream2 = fs.createWriteStream(saveAs);
            var svgWidth = widthInPixels + 20;
            //var svgHeight = coilHeightInPixels + 40;
            var svgPieces = coil.generateSvgPieces(jsonToSave, meterPerPixel, svgWidth, strokeColor, strokeWidth);
            var numberOfSvgPieces = svgPieces.length;
            for (var i = 0; i < numberOfSvgPieces; i++) {
                stdout('      Saving Path ' + (i + 1) + '/' + numberOfSvgPieces);
                wstream2.write(svgPieces[i] + '\n');
            }
            wstream2.end();
            stdout('      Done');
            callback();
        });
    });
}

function saveStats(lengthInM, entireArea, coilHeightInPixels) {
    var output = '';
    output += '"' + mobilityType[collectionNameIn] + '": {\n';
    output += '    "area": ' + Math.round(entireArea * 100) / 100 + ',\n';
    output += '    "length": ' + Math.round(lengthInM) / 100 + ',\n';
    output += '    "svgHeight": ' + Math.round(coilHeightInPixels) / 100 + '\n';
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