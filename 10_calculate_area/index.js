var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var async = require('async');
var mongodb = require('mongodb');
var parseOsmUnits = require(path.join('..', 'lib', 'parse-osm-units'));

var MongoClient = mongodb.MongoClient;

var query;
var queryDefault = "{}";

var limitQuery;
var limitQueryDefault = false;

var areaCounter = {
    "car": {},
    "bike": {},
    "rail": {}
};
var lengthCounter = {
    "car": {},
    "bike": {},
    "rail": {}
};

main();

function main() {
    printInstructions();
    getParameters();
    if (argv.mongodb) {
        printProgressStart();

        countWidthOccurences(argv.mongodb)
            .then(addFallbacksToMissingOccurences)
            .then(processOccurences)
            .then(calculateAreaAndUpdateEntry)
            .then(printSummary);
    }
}

function getParameters() {
    limitQuery = argv.limit || limitQueryDefault;
    query = JSON.parse(argv.query || queryDefault);
}

function countWidthOccurences(mongoUrl) {
    return new Promise(function(resolve, reject) {
        var occurences = {
            "car": {},
            "bike": {},
            "rail": {}
        }

        console.log();
        console.log('   1. Getting average area per length and lane for streets');
        stdout('      Connecting to mongodb ' + mongoUrl);
        MongoClient.connect(mongoUrl, function(err, db) {
            if (err) {
                reject(Error(err));
            }
            stdout('      Connection successful');
            var collection = db.collection('ways');
            var cursor = collection.find(query, {}, { limit: limitQuery });

            cursor.on('data', function(way) {
                stdout('      Way ' + way._id);
                // Are we using the right DB?
                if (!way.properties) {
                    printErrorProperties();
                    reject();
                }

                // Analyze way

                var relevantWayTypes = getRelevantWayTypes(way);
                for (mobilityKind in relevantWayTypes) {
                    var relevantWayType = relevantWayTypes[mobilityKind];
                    var w = getWidth(way);

                    // For streets with width
                    if (mobilityKind === 'car' && w) {
                        var numberOfLanes = getNumberOfLanes(way)
                        var l = getLength(way);
                        var a = w * l;

                        // Add entry to object
                        if (!occurences.car[relevantWayType]) {
                            occurences.car[relevantWayType] = {
                                "length": 0,
                                "area": 0
                            }
                        }
                        occurences.car[relevantWayType].length += l;
                        occurences.car[relevantWayType].area += a / numberOfLanes;
                    }

                    // For bikelanes with width
                    if (mobilityKind === 'bike' && w && (way.properties.highway.highway === 'path' || way.properties.highway.highway === 'cycleway')) {

                        var l = getLength(way);
                        var a = w * l;

                        if (relevantWayType === 'designated' || relevantWayType === 'cycleway') {
                            // track does not work here, because it is only part of the road
                            var numberOfLanes = 1; // A bike way normally has only 1 lane

                            if (!occurences.bike[relevantWayType]) {
                                occurences.bike[relevantWayType] = {
                                    "length": 0,
                                    "area": 0
                                }
                            }

                            occurences.bike[relevantWayType].length += l;
                            occurences.bike[relevantWayType].area += a / numberOfLanes;
                        }
                    }

                    if (mobilityKind === 'rail' && w) {
                        // Didn't return any result for Berlin, so we are not using it
                    }
                }
            });

            cursor.on('end', function() {
                stdout('      Done');
                console.log();
                db.close();
                resolve(occurences);
            });
        });
    });
}

function calculateAreaAndUpdateEntry(perMeterAndLane) {
    return new Promise(function(resolve, reject) {
        console.log();
        console.log('   4. Calculating area and updating MongoDB');
        stdout('      Connecting to mongodb ' + argv.mongodb);
        MongoClient.connect(argv.mongodb, function(err, db) {
            if (err) {
                reject(Error(err));
            }

            stdout('      Connection successful');
            var collection = db.collection('ways');
            var cursor = collection.find(query, {}, { limit: limitQuery });

            cursor.on('data', function(way) {
                stdout('      Way ' + way._id);
                cursor.pause();
                var relevantWayTypes = getRelevantWayTypes(way);
                var output = {};
                for (mobilityKind in relevantWayTypes) {
                    var relevantWayType = relevantWayTypes[mobilityKind];
                    var w = getWidth(way);
                    var l = getLength(way);

                    if (mobilityKind === 'car') {
                        var a;
                        if (w) {
                            a = l * w;
                        } else {
                            var numberOfLanes = getNumberOfLanes(way);
                            var wAverage = perMeterAndLane[mobilityKind][relevantWayType];
                            a = l * wAverage * numberOfLanes;
                        }
                        a = Number(a.toFixed(3));
                        output[mobilityKind] = a;
                    }else if (mobilityKind === 'bike') {
                        var wAverage = perMeterAndLane[mobilityKind][relevantWayType];
                        var a = l * wAverage;
                        a = Number(a.toFixed(3));
                        output[mobilityKind] = a;
                    } else if (mobilityKind === 'rail') {
                        var numberOfTracks = getNumberOfTracks(way);
                        var wAverage = perMeterAndLane[mobilityKind][relevantWayType];
                        var a = l * wAverage * numberOfTracks;
                        a = Number(a.toFixed(3));
                        output[mobilityKind] = a;
                    }

                    // Count areas
                    if (!areaCounter[mobilityKind][relevantWayType]) {
                        areaCounter[mobilityKind][relevantWayType] = 0;
                    }
                    areaCounter[mobilityKind][relevantWayType] += a;

                    // Count Length

                    if (!lengthCounter[mobilityKind][relevantWayType]) {
                        lengthCounter[mobilityKind][relevantWayType] = 0;
                    }
                    lengthCounter[mobilityKind][relevantWayType] += l;
                }

                // Update entry
                way.properties_derived.areaEstimate = output;
                collection.update({ _id: way._id }, way, function() {
                    cursor.resume();
                });

            });
            cursor.on('end', function(way) {
                stdout('      Done');
                console.log();
                db.close();
                resolve();
            });
        });
    });
}

function getNumberOfTracks(way) {
    if (way.properties && way.properties.tracks && way.properties.tracks.tracks) {
        return way.properties.tracks.tracks;
    } else {
        return 1;
    }
}

function getWidth(way) {
    var width = null;
    if (way.properties && way.properties.width && way.properties.width.width) {
        width = way.properties.width.width;
        width = parseOsmUnits.convertToDefaultUnits(width, 'distance');
    }

    return width;
}

function getLength(way) {
    var length = null;
    if (way.properties_derived && way.properties_derived.length) {
        length = way.properties_derived.length;
    }
    return length;
}

function getRelevantWayTypes(way) {
    var relevantWayTypes = {};

    // Types we are using (according to Michael's Jupyter Notebooks)
    // Bike
    //      bicycle: designated
    //      highway: cycleway
    //      cycleway: track
    //
    // Rail
    //      railway: tram
    //      railway: light_rail
    //      railway: rail
    //      railway: subway
    //      railway: narrow_gauge
    //      railway: funicular
    //      railway: monorail
    //
    // Car
    //      highway: service
    //      highway: residential
    //      highway: primary
    //      highway: secondary
    //      highway: tertiary
    //      highway: unclassified

    // Search in Highway Tag
    if (way.properties.highway && way.properties.highway.highway) {
        var hw = way.properties.highway.highway;
        var hwTypes = ['service', 'residential', 'primary', 'secondary', 'tertiary', 'unclassified'];
        var bcTypes = ['cycleway'];

        // Car Highway
        if (inArray(hw, hwTypes)) {
            relevantWayTypes.car = hw;
        }

        // Bike Highway
        if (inArray(hw, bcTypes)) {
            relevantWayTypes.bike = hw;
        }
    }

    // Search in Railway Tag
    if (way.properties.railway && way.properties.railway.railway) {
        var rw = way.properties.railway.railway;
        var rwTypes = ['tram', 'light_rail', 'rail', 'subway', 'narrow_gauge', 'funicular', 'monorail'];
        if (inArray(rw, rwTypes)) {
            relevantWayTypes.rail = rw;
        }
    }

    // Search in Cycleway Tag
    if (way.properties.cycleway && way.properties.cycleway.cycleway) {
        var cw = way.properties.cycleway.cycleway;
        var cwTypes = ['track'];
        if (inArray(cw, cwTypes)) {
            relevantWayTypes.bike = cw;
        }
    }

    // Search in Bicycle Tag
    if (way.properties.bicycle && way.properties.bicycle.bicycle) {
        var bc = way.properties.bicycle.bicycle;
        var bcTypes = ['designated'];
        if (inArray(bc, bcTypes)) {
            relevantWayTypes.bike = bc;
        }
    }

    if (Object.keys(relevantWayTypes).length > 0) {
        return relevantWayTypes;
    } else {
        return null;
    }
}


function getNumberOfLanes(way) {
    //Source http://wiki.openstreetmap.org/wiki/Key:lanes#Assumptions
    var assumedLaneCountTwoWay = {
        'residential': 2,
        'tertiary': 2,
        'secondary': 2,
        'primary': 2,
        'service': 1,
        'track': 1,
        'path': 1
    };

    if (way.properties.highway && way.properties.highway.highway) {
        var highwayType = way.properties.highway.highway;
        var computedNumberOfLanes = assumedLaneCountTwoWay[highwayType] || 2;
        var lanes = null;
        var forward = null;
        var backward = null;
        var oneway = false;

        if (way.properties.lanes) {
            // Get number of lanes (in both ways)
            if (way.properties.lanes.lanes) {
                if (isNaN(way.properties.lanes.lanes)) {

                    if (way.properties.lanes.lanes.includes(';')) {
                        // e.g. http://www.openstreetmap.org/way/151983704
                        var temp = way.properties.lanes.lanes.replace(' ', '');
                        var temparr = temp.split(';');
                        for (var i = 0; i < temparr.length; i++) {
                            temparr[i] = Number(temparr[i]);
                        }
                        lanes = sumArrayValues(temparr);
                        //console.log("Lane information is weird", 'lanes ' + lanes, way);
                    } else {
                        // This should never happen
                        console.log("Lane information is NaN", way);
                        //process.exit();
                        lanes = null;
                    }
                } else {
                    // Read number of lanes
                    lanes = Number(way.properties.lanes.lanes);
                }
            }

            // Get number of lanes forward
            if (way.properties.lanes.forward) {
                if (isNaN(way.properties.lanes.forward)) {
                    // This should never happen
                    console.log("Lane information is NaN", way);
                    forward = null;
                    //process.exit();
                } else {
                    // Read number of lanes forward
                    forward = Number(way.properties.lanes.forward);
                }
            }

            // Get number of lanes backward
            if (way.properties.lanes.backward) {
                if (isNaN(way.properties.lanes.backward)) {
                    // This should never happen
                    console.log("Lane information is NaN", way);
                    //process.exit();
                    backward = null;
                } else {
                    // Read number of lanes backward
                    backward = Number(way.properties.lanes.backward);
                }
            }

            // Calculate number of lanes
            if (lanes) {
                computedNumberOfLanes = lanes;
            } else if (forward && backward) {
                computedNumberOfLanes = forward + backward;
            } else if (forward) {
                computedNumberOfLanes = forward;
            } else if (backward) {
                computedNumberOfLanes = backward;
            }

            // Get direction information
            if (way.properties.oneway && way.properties.oneway.oneway) { // Because there are other cases, like only bicycle one way
                if (way.properties.oneway.oneway == 'yes') {
                    oneway = true;
                } else if (way.properties.oneway.oneway == 'no') {
                    oneway = false;
                } else if (way.properties.oneway.oneway == -1) {
                    // See http://wiki.openstreetmap.org/wiki/Key:oneway#Normal_use
                    oneway = true;
                } else if (way.properties.oneway.oneway == 'reversible') {
                    // See https://wiki.openstreetmap.org/wiki/Tag:oneway%3Dreversible - e.g. 27264847
                    oneway = true;
                } else {
                    // This should never happen
                    console.log(way);
                    process.exit();
                }
            } else if (forward && backward) { //redundant
                oneway = false;
            } else if (forward && !backward) {
                oneway = true;
            } else if (!forward && backward) {
                oneway = true;
            }
        }

        return computedNumberOfLanes;
    } else {
        return 1; // Only bikelanes afa I can tell
    }
}


function sumArrayValues(a) {
    return a.reduce(function(a, b) {
        return a + b; }, 0);
}


// Helpers
function inArray(value, arr) {
    if (arr.indexOf(value) > -1) {
        return true;
    } else {
        return false;
    }
}

function addFallbacksToMissingOccurences(occurences) {
    console.log();
    console.log('   2. Using fallbacks for missing values in dataset');

    // Fallbacks for:
    // cars are taken from Berlin
    // bikes
    //     track: measured
    //     designated & cycleway (taken from Berlin)
    // rails were
    //     tram equals tertiary street size (because they run on that)
    //     light_rail measured in Berlin
    //     rail measured in Berlin
    //     subway measured in Berlin
    //     narrow_gauge measured in Berlin
    //     funicular measured in Stuttgart
    //     monorail measured in Chester

    // (Measurings with https://www.daftlogic.com/projects-google-maps-area-calculator-tool.htm)
    var fallbacks = {
        "car": {
            "service": { "length": 27896.39344782315, "area": 110925.94555072353 },
            "residential": { "length": 113030.81578047737, "area": 409121.5575299361 },
            "primary": { "length": 3015.9909653510217, "area": 10030.219833854235 },
            "secondary": { "length": 4759.6243327021575, "area": 23789.849002010542 },
            "tertiary": { "length": 19617.144074377127, "area": 79183.1527282509 },
            "unclassified": { "length": 13105.630666617299, "area": 42324.08874589544 }
        },
        "bike": {
            "track": { "length": 106.10, "area": 170.41 },
            "designated": { "length": 107988.96752183285, "area": 299112.226661055 },
            "cycleway": { "length": 3419.8019526581766, "area": 8579.888947141335 }
        },
        "rail": {
            "light_rail": { "length": 116.91, "area": 535.94 },
            "rail": { "length": 89.19, "area": 463.82 },
            "subway": { "length": 106.46, "area": 463.135 },
            "narrow_gauge": { "length": 18.37, "area": 47.59 },
            "funicular": { "length": 49.72, "area": 174.52 },
            "monorail": { "length": 86.23, "area": 139.08 },
            "tram": "will be replaced"
        }
    }

    // Fallback for 
    var log = 'Value exists or Fallback used:\n';
    for (mobilityKind in fallbacks) {
        var fallback = fallbacks[mobilityKind];
        log += '      ' + mobilityKind + ':\n'
        for (wayType in fallback) {
            if (occurences[mobilityKind][wayType]) {
                log += '         - ' + wayType + ': Value exists\n';
            } else {
                log += '         - ' + wayType + ': Fallback\n';
                if (mobilityKind === 'rail' && wayType === 'tram') { // Because they run on this way type
                    occurences['rail']['tram'] = occurences['car']['tertiary'] || fallbacks['car']['tertiary'];
                } else {
                    occurences[mobilityKind][wayType] = fallbacks[mobilityKind][wayType];
                }
            }
        }
        log += '\n';
    }
    console.log(log);

    fs.writeFileSync( path.join(__dirname, 'export', 'log_' + getCityName() + '.txt'), log);
    return occurences;
}

function getCityName() {
    var pathPieces = argv.mongodb.split('/');
    var cityName = pathPieces[pathPieces.length - 1];
    cityName = cityName.replace('_derived', '');
    return cityName;
}

function processOccurences(occurences) {
    console.log('   3. Get average area per meter and lane for ');

    var perMeterAndLane = {
        "car": {},
        "bike": {},
        "rail": {}
    }

    var log = '\nResulting Values:\n';
    for (mobilityKind in occurences) {
        var occurence = occurences[mobilityKind];
        log += '      ' + mobilityKind + ':\n';
        for (wayType in occurence) {
            var entry = occurence[wayType];
            var length = entry.length;
            var area = entry.area;
            var areaPerMeter = area / length;
            perMeterAndLane[mobilityKind][wayType] = areaPerMeter;
            log += '         - ' + wayType + ': ' + areaPerMeter.toFixed(3) + ' m2\n';
        }
        log += '\n';
    }

    console.log(log);
    fs.appendFileSync('log_' + getCityName() + '.txt', log);
    return perMeterAndLane;
}


// Output
function printErrorProperties() {
    console.log();
    console.log();
    console.log('   Error: Properties could not be found');
    console.log('      - Are you sure your are using the right db?');
    console.log('      - db should end with _derived');
    console.log();
    console.log('   Exiting now');
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

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('   node index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived');
    console.log('');
    console.log('   --mongodb: The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
    console.log();
}

function printProgressStart() {
    console.log();
    console.log('--------------');
    console.log('   PROGRESS      ');
    console.log('--------------');
}

function printSummary() {
    console.log();
    console.log();
    console.log('--------------');
    console.log('   COMPLETE      ');
    console.log('--------------');
    console.log();

    var forJson = {
        "area": {},
        "length": {}
    }


    console.log();
    console.log('   - Area Breakdown');
    var totalCounter = 0;
    for (mobilityKind in areaCounter) {
        var counter = 0;
        var fallback = areaCounter[mobilityKind];
        console.log('      ' + mobilityKind + ':');

        forJson.area[mobilityKind] = {};

        for (wayType in fallback) {
            fallback[wayType] = Number(fallback[wayType].toFixed(2));
            counter += fallback[wayType];
            console.log('         - ' + wayType + ' = ' + fallback[wayType] + ' m2');
            forJson.area[mobilityKind][wayType] = fallback[wayType];
        }
        console.log('           ----------------------');
        counter = Number(counter.toFixed(2));
        console.log('                          ' + counter + 'm2');
        console.log();
        totalCounter += counter
        forJson.area[mobilityKind].total = counter;
    }
    console.log('      ---------------------------');
    console.log('                    ' + totalCounter + ' m2');
    forJson.area.total = totalCounter;

    console.log();
    console.log();
    console.log('   - Length Breakdown');
    var totalCounter = 0;
    for (mobilityKind in lengthCounter) {
        var counter = 0;
        var fallback = lengthCounter[mobilityKind];
        console.log('      ' + mobilityKind + ':');

        forJson.length[mobilityKind] = {};

        for (wayType in fallback) {
            fallback[wayType] = Number(fallback[wayType].toFixed(2));
            counter += fallback[wayType];
            console.log('         - ' + wayType + ' = ' + fallback[wayType] + ' m');
            forJson.length[mobilityKind][wayType] = fallback[wayType];
        }
        console.log('           ----------------------');
        counter = Number(counter.toFixed(2));
        console.log('                          ' + counter + ' m');
        console.log();
        totalCounter += counter
        forJson.length[mobilityKind].total = counter;
    }
    console.log('      ---------------------------');
    console.log('                    ' + totalCounter + ' m');
    forJson.length.total = totalCounter;


    console.log();
}