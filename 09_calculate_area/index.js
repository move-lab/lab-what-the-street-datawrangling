var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var defaultCollectionName = "ways";
var collectionName;

var areaCounter = { total: 0 };
var lengthCounter = { total: 0 };

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

var occurences = {};

main();

function main() {
    printInstructions();
    if (argv.mongodb) {
        collectionName = argv.collection || defaultCollectionName;

        printActiveSettings();
        printProgressStart();
        console.log();
        console.log('   1. Analyze Existing Widths');
        analyzeWitdhs(argv.mongodb);
    }
}

function updateOccurences() {
    for (type in occurences) {
        var subOccurences = occurences[type];
        for (subType in subOccurences) {
            if (subOccurences[subType].counting) {
                subOccurences[subType].widthPerLane = subOccurences[subType].counting.widthPerLane / subOccurences[subType].counting.lengthInMeter;
            }
        }
    }
}


function analyzeWitdhs(mongoUrl) {
    var counter = 0;
    stdout('      Connecting to mongodb ' + mongoUrl);
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            stdout('      Connection successful');
            var collection = db.collection(collectionName);
            var cursor = collection.find({});

            cursor.once('end', function() {
                db.close();
                stdout('      Done (' + counter + ' ways)');

                updateOccurences();
                console.log();
                console.log();
                console.log('   2. Calculating Area');
                console.log();
                console.log();
                console.log(JSON.stringify(occurences));
                console.log();
                console.log();
                calculateAndUpdateWidthInformation(mongoUrl);
            });

            cursor.on('data', function(doc) {
                stdout('      Processing Way #' + counter);
                var wayType;
                if (doc.properties.highway) {
                    wayType = 'highway';
                    stdoutappend(' | type: highway');
                } else if (doc.properties.railway) {
                    wayType = 'railway';
                    stdoutappend(' | type: railway');
                } else {
                    wayType = 'irrelevant';
                    stdoutappend(' | irrelevant type - ignoring');
                }
                getInformationFor(wayType, doc);
                counter++;
            });
        }
    });
}

function calculateAndUpdateWidthInformation(mongoUrl) {
    var counter = 0;
    stdout('      Connecting to mongodb ' + mongoUrl);
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            stdout('      Connection successful');
            var collection = db.collection(collectionName);
            var cursor = collection.find({});

            cursor.once('end', function() {
                db.close();
                stdout('      Done (' + counter + ' ways)');
                printSummary();
            });

            cursor.on('data', function(doc) {
                stdout('      Updating Way #' + counter);
                var wayType;
                if (doc.properties.highway) {
                    wayType = 'highway';
                    stdoutappend(' | type: highway');
                } else if (doc.properties.railway) {
                    wayType = 'railway';
                    stdoutappend(' | type: railway');
                } else {
                    wayType = 'irrelevant';
                    stdoutappend(' | irrelevant type - ignoring');
                }
                updateInformationFor(wayType, doc, collection);
                counter++;
            });
        }
    });
}

function updateInformationFor(wayType, doc, collection) {
    switch (wayType) {
        case 'highway':
            var laneInformation = getLaneInformation(doc);
            if (laneInformation.highwayType) {
                var area;
                var width;
                var forComparison = getHighwayTypeForComparison(doc.properties.highway.highway);;
                if (doc.properties.width && doc.properties.width.width) {
                    width = getCleanValueAsMeter(doc.properties.width.width);
                } else {
                    if (occurences[wayType][forComparison]) {
                        width = laneInformation.numberOfLanes * occurences[wayType][forComparison].widthPerLane;
                    } else if (forComparison == 'trunk' && !occurences[wayType][forComparison]) {
                        // If trunk and not existing, use the information for motorway instead;
                        width = laneInformation.numberOfLanes * occurences[wayType]['motorway'].widthPerLane;
                    } else if (forComparison === 'd' || forComparison === 'corridor' || forComparison === 'platform' || forComparison === 'access_ramp' || forComparison === 'layby' ||  forComparison === 'elevator' || forComparison === 'abandoned' ||  forComparison === 'none' ||  forComparison === 'bus_stop' ||  forComparison === 'services' || forComparison === 'traffic_island') {
                        // see 
                        // d:  http://www.openstreetmap.org/way/26819749
                        // corridor:  http://www.openstreetmap.org/way/41699327
                        // platform:  http://www.openstreetmap.org/way/48044088
                        // access_ramp:  http://www.openstreetmap.org/way/165729720
                        // layby:  http://www.openstreetmap.org/way/171879602
                        // elevator:  http://www.openstreetmap.org/way/176494836
                        // abandoned:  http://www.openstreetmap.org/way/199360470
                        // none:  http://www.openstreetmap.org/way/225539438
                        // bus_stop:  http://www.openstreetmap.org/way/319692394
                        // traffic_island:  http://openstreetmap.org/way/342881078
                        width = 0;
                    } else {
                        console.log();
                        console.log('-------------------');
                        console.log(doc, occurences);
                        console.log('-------------------');
                        width = 0;
                    }
                }

                if (doc.properties_derived) {
                    if (doc.properties_derived.length) {
                        area = width * doc.properties_derived.length;

                        // Update Doc
                        doc.properties_derived.width = width;
                        doc.properties_derived.area = area;
                        collection.update({ _id: doc["_id"] }, doc);

                        // Count Area
                        if (isNaN(area)) {
                            console.log();
                            console.log();
                            console.log(area, doc);
                        }

                        areaCounter.total += area;

                        if (!areaCounter[forComparison]) {
                            areaCounter[forComparison] = 0;
                        }
                        areaCounter[forComparison] += area;

                        // Count Length
                        lengthCounter.total += doc.properties_derived.length;
                        if (!lengthCounter[forComparison]) {
                            lengthCounter[forComparison] = 0;
                        }
                        lengthCounter[forComparison] += doc.properties_derived.length;
                    }
                }
            }
            break;

        case 'railway':
            var railInformation = getRailInformation(doc);
            if (railInformation && railInformation.trackType) {
                var area;
                var width;
                var forComparison = railInformation.trackType;
                if (doc.properties.width && doc.properties.width.width) {
                    width = getCleanValueAsMeter(doc.properties.width.width);
                } else {
                    if (occurences[wayType][forComparison]) {
                        width = railInformation.numberOfTracks * occurences[wayType][forComparison].widthPerLane;
                    // } else {
                    //     width = 0;
                    } else {
                        console.log();
                        console.log('-------------------');
                        console.log(JSON.stringify(doc), JSON.stringify(occurences));
                        console.log('-------------------');
                        width = 0;
                    }
                }

                if (doc.properties_derived) {
                    if (doc.properties_derived.length) {
                        area = width * doc.properties_derived.length;

                        // Update Doc
                        doc.properties_derived.width = width;
                        doc.properties_derived.area = area;
                        collection.update({ _id: doc["_id"] }, doc);

                        // Count Area
                        if (isNaN(area)) {
                            console.log();
                            console.log();
                            console.log(area, doc);
                        }

                        areaCounter.total += area;

                        if (!areaCounter[forComparison]) {
                            areaCounter[forComparison] = 0;
                        }
                        areaCounter[forComparison] += area;

                        // Count Length
                        lengthCounter.total += doc.properties_derived.length;
                        if (!lengthCounter[forComparison]) {
                            lengthCounter[forComparison] = 0;
                        }
                        lengthCounter[forComparison] += doc.properties_derived.length;
                    }
                }
            }
            break;

        case 'irrelevant':
            break;
    }
}

function getInformationFor(wayType, doc) {
    switch (wayType) {
        case 'highway':
            var laneInformation = getLaneInformation(doc);

            if (laneInformation.highwayType) {
                stdoutappend(' | highway ' + laneInformation.highwayType + ' with ' + laneInformation.numberOfLanes + ' lane(s)');
                calculateStreetWidth(doc, laneInformation);
            }
            break;

        case 'railway':
            var railInformation = getRailInformation(doc);
            if (railInformation !== null) {
                calculateRailWidth(doc, railInformation);
            }
            break;

        case 'irrelevant':
            stdout('      Irrelevant way type - ignoring');
            break;
    }
}

function calculateRailWidth(doc, railInformation) {
    var consoleOutput = "";

    if (doc.properties_derived) {
        if (doc.properties.width) {
            if (doc.properties.width.width) {
                var railWidth = getCleanValueAsMeter(doc.properties.width.width);
                if (railWidth !== null) {
                    countWidthOccurences('railway', railWidth, doc.properties_derived.length, railInformation, railInformation.trackType, railInformation.numberOfTracks);
                }
            }
        }
    }
}

function getCleanNumberOfRailTracks(tracks, doc) {
    if (isNaN(tracks)) {
        if (tracks.includes(';')) {
            var split = tracks.split(';');
            var value = 0;
            for (var i = 0; i < split.length; i++) {
                value += Number(split[i]);
            }

            if (isNaN(value)) {
                throw JSON.stringify(doc);
            } else {
                return value;
            }
        }
    } else {
        return tracks;
    }
}

function add(a, b) {
    return a + b;
}

function getRailInformation(doc) {
    var numberOfTracks = 1;
    var trackType;
    if (doc.properties.tracks && doc.properties.tracks.tracks) {
        numberOfTracks = getCleanNumberOfRailTracks(doc.properties.tracks.tracks, doc);
    }

    if (doc.properties.railway && doc.properties.railway.railway) {
        trackType = doc.properties.railway.railway;
    } else {
        if (doc.properties.disused && doc.properties.disused.disused && doc.properties.disused.disused === 'yes') {
            return null;
        } else {
            throw JSON.stringify(doc);
        }
    }

    output = {};
    output.trackType = trackType;
    output.numberOfTracks = numberOfTracks;
    return output;
}

function getLaneInformation(doc) {
    var highwayType = null;
    var computedNumberOfLanes = null;
    var lanes = null;
    var forward = null;
    var backward = null;
    var oneway = false;
    var output = {};

    if (doc.properties.highway) {
        highwayType = doc.properties.highway.highway;
        computedNumberOfLanes = assumedLaneCountTwoWay[highwayType] || 2;

        if (doc.properties.lanes) {

            // Get number of lanes (in both ways)
            if (doc.properties.lanes.lanes) {
                if (isNaN(doc.properties.lanes.lanes)) {
                    // This should never happen
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    // Read number of lanes
                    lanes = Number(doc.properties.lanes.lanes);
                }
            }

            // Get number of lanes forward
            if (doc.properties.lanes.forward) {
                if (isNaN(doc.properties.lanes.forward)) {
                    // This should never happen
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    // Read number of lanes forward
                    forward = Number(doc.properties.lanes.forward);
                }
            }

            // Get number of lanes backward
            if (doc.properties.lanes.backward) {
                if (isNaN(doc.properties.lanes.backward)) {
                    // This should never happen
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    // Read number of lanes backward
                    backward = Number(doc.properties.lanes.backward);
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
            if (doc.properties.oneway) {
                if (doc.properties.oneway.oneway) { // Because there are other cases, like only bicycle one way
                    if (doc.properties.oneway.oneway == 'yes') {
                        oneway = true;
                    } else if (doc.properties.oneway.oneway == 'no') {
                        oneway = false;
                    } else if (doc.properties.oneway.oneway == -1) {
                        // See http://wiki.openstreetmap.org/wiki/Key:oneway#Normal_use
                        oneway = true;
                    } else {
                        // This should never happen
                        console.log(doc);
                        process.exit();
                    }
                }
            } else if (forward && backward) { //redundant
                oneway = false;
            } else if (forward && !backward) {
                oneway = true;
            } else if (!forward && backward) {
                oneway = true;
            }
        }
    }

    output.highwayType = highwayType;
    output.numberOfLanes = computedNumberOfLanes;
    output.forward = forward;
    output.backward = backward;
    output.oneway = oneway;
    return output;
}


function calculateStreetWidth(doc, laneInformation) {
    var consoleOutput = "";

    if (doc.properties_derived) {
        var streetLength = doc.properties_derived.length;
        var highwayTypeForComparison = getHighwayTypeForComparison(laneInformation.highwayType);

        if (doc.properties.width) {
            if (doc.properties.width.width) {
                var streetWidth = getCleanValueAsMeter(doc.properties.width.width);
                if (streetWidth !== null) {
                    countWidthOccurences('highway', streetWidth, doc.properties_derived.length, laneInformation, laneInformation.highwayType, laneInformation.numberOfLanes);
                }
            }
        }
    }
}

function getHighwayTypeForComparison(type) {
    type = type.replace('_link', '');
    if (type == 'road') {
        // 'road' is only a temporary tag, use unclassified as a fallback instead
        // More information http://wiki.openstreetmap.org/wiki/Tag:highway%3Droad
        return 'unclassified';
    }
    return type;
}

function countWidthOccurences(type, streetWidth, streetLength, laneInformation, wayType, numberOfLanes) {
    if (!occurences[type]) {
        occurences[type] = {};
    }
    if (!occurences[type][wayType]) {
        occurences[type][wayType] = {
            occurences: 0,
            counting: {
                lengthInMeter: 0,
                widthPerLane: 0
            }
        }
    }
    var highway = occurences[type][wayType];

    highway.occurences += 1;
    highway.counting.lengthInMeter += streetLength;
    highway.counting.widthPerLane += streetWidth / numberOfLanes * streetLength;

    if (isNaN(highway.counting.lengthInMeter) ||  isNaN(highway.counting.widthPerLane)) {
        console.log(type, streetWidth, streetLength, laneInformation);
        process.exit();
    };
}

function getCleanValueAsMeter(string) {
    // Because units can be used in strings 
    // See http://wiki.openstreetmap.org/wiki/Key:width

    if (string === 'narrow') {
        // Legacy tagging http://wiki.openstreetmap.org/wiki/Proposed_features/Narrow_width
        return null
    }

    if (string.includes(';')) {
        // Appears to be mistagged http://wiki.openstreetmap.org/wiki/Semi-colon_value_separator
        return null
    }

    if (string.includes(',')) {
        // Malformatted http://wiki.openstreetmap.org/wiki/Key:width#Incorrect_values
        string = string.replace(',', '.');
    }

    if (string.includes(' km') || string.includes('km')) {
        string = (string.replace(' km', '')).replace('km', '');
        string = Number(string) * 1000;
    } else if (string.includes(' m') || string.includes('m')) {
        string = (string.replace(' m', '')).replace('m', '');
    } else if (string.includes(' mi') || string.includes('mi')) {
        string = (string.replace(' mi', '')).replace('mi', '');
        string = Number(string) * 1609.34;
    }

    var output = string;

    if (isNaN(output)) {
        // This should never happen
        console.log();
        console.log(string);
        console.log();
        process.exit();
    };
    return Number(output);
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('   node index.js --mongodb mongodb://username:password@ip:port/db?authSource=admin --collection ways');
    console.log('');
    console.log('   --mongodb: The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
    console.log('   --collection: [optional] The name of the collection you want to connect to - defaults to ' + defaultCollectionName);
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

function printActiveSettings() {
    console.log('--------------');
    console.log('   SETTINGS      ');
    console.log('--------------');
    console.log();
    console.log('   - mongodb: ' + argv.mongodb);
    console.log('   - collection: ' + collectionName);
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
    console.log('   - All area:   ' + areaCounter.total + 'm2');
    console.log('   - Entire length:   ' + lengthCounter.total + 'm');

    var entireStreetArea = (areaCounter.residential || 0) + (areaCounter.primary || 0) + (areaCounter.secondary || 0) + (areaCounter.motorway || 0) + (areaCounter.living_street || 0) + (areaCounter.tertiary || 0) + (areaCounter.service || 0) + (areaCounter.unclassified || 0) + (areaCounter.trunk || 0);
    var entireStreetLength = (lengthCounter.residential || 0) + (lengthCounter.primary || 0) + (lengthCounter.secondary || 0) + (lengthCounter.motorway || 0) + (lengthCounter.living_street || 0) + (lengthCounter.tertiary || 0) + (lengthCounter.service || 0) + (lengthCounter.unclassified || 0) + (lengthCounter.trunk || 0);

    console.log('   - All streets: ' + entireStreetArea + 'm2');
    console.log('   - All streets: ' + entireStreetLength + 'm');
    console.log();
    console.log('   Lengths\n', lengthCounter);
    console.log();
    console.log('   Areas\n', areaCounter);
    console.log();
}