var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var defaultCollectionName = "ways";
var collectionName;
var streetWidthsReference;
var streetWidthsFromCountry;

// Berlin: 9490,0 ha
var areaCounter = 0;
var areaCounterOsmAverage = 0;
var areaCounterOsmAverageAlternative = 0;
var distanceCounter = 0;
var progressCounter = 0;

var streetWidthOccurences = {};
var onlyUseHighwayTypes = [
    'motorway',
    'trunk',
    'primary',
    'secondary',
    'tertiary',
    'unclassified',
    'residential',
    'service',
    'motorway_link',
    'trunk_link',
    'primary_link',
    'secondary_link',
    'tertiary_link',
    'living_street',
    'road'
]

main();

function m2ToHa(m2) {
    return m2 * 0.0001;
}

function main() {
    if (argv.mongodb && argv.widths && argv.country) {
        collectionName = argv.collection || defaultCollectionName;
        fs.readFile(argv.widths, 'utf8', function(err, data) {
            if (err) {
                return console.log(err);
            }
            data = JSON.parse(data);
            streetWidthsFromCountry = argv.country;
            streetWidthsReference = data[streetWidthsFromCountry];
            console.log('Using Reference from ' + streetWidthsFromCountry);
            console.log();
            processMongodb(argv.mongodb);
        });

    } else {
        printInstructions();
    }
}

function processMongodb(mongoUrl) {
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            var collection = db.collection(collectionName);
            var cursor = collection.find({});

            cursor.once('end', function() {
                db.close();

                console.log();
                console.log('All done');
                console.log(Math.round(m2ToHa(areaCounter)), 'ha (researched)');
                console.log(Math.round(m2ToHa(areaCounterOsmAverage)), 'ha (osm average)');
                console.log(Math.round(m2ToHa(areaCounterOsmAverageAlternative)), 'ha (osm average alternative)');
                console.log(Math.round(distanceCounter / 1000), 'km')
                calculateWidthOccurences();
                console.log('breakdown', streetWidthOccurences);
            });

            cursor.on('data', function(doc) {
                var laneInformation = getLaneInformation(doc);
                if (laneInformation.highwayType) {
                    var widthInformation = getWidthInformation(doc, laneInformation);
                };
            });
        }
    });
}

function getWidthInformation(doc, laneInformation) {
    var highwayTypeForComparison = laneInformation.highwayType;
    var streetLength = doc.properties_derived.length;
    var highwayReference;
    var streetWidth;
    var streetArea;
    var consoleOutput = "";

    if (onlyUseHighwayTypes.indexOf(highwayTypeForComparison) != -1) {
        highwayTypeForComparison = highwayTypeForComparison.replace('_link', ''); // E.g. primary_link will be judged as primary

        if (highwayTypeForComparison == 'road') {
            // 'road' is only a temporary tag, use unclassified as a fallback instead
            // More information http://wiki.openstreetmap.org/wiki/Tag:highway%3Droad
            highwayTypeForComparison = 'unclassified';
        }

        //only for testing
        if (highwayTypeForComparison == 'residential' || highwayTypeForComparison == 'service' || highwayTypeForComparison == 'living_street' || highwayTypeForComparison == 'tertiary' || highwayTypeForComparison == 'trunk') {
            highwayTypeForComparison = 'unclassified';
        }

        highwayReference = streetWidthsReference.highway[highwayTypeForComparison];
        consoleOutput += '[' + progressCounter + '] ' + highwayReference.name;

        progressCounter++;
        if (highwayReference.laneWidth) {
            // margin always times 2 because they appear on both sides
            // separator divided by 2, otherwise it will be counted twice (Autobahn lanes are tagged separately)
            streetWidth = highwayReference.laneWidth * laneInformation.numberOfLanes + 2 * highwayReference.outerMargin + 2 * highwayReference.innerMargin + 2 * highwayReference.outestMargin + highwayReference.separator / 2;
            if (doc.properties.width) {
                if (doc.properties.width.width) {

                    // Because units can be used in strings 
                    // See http://wiki.openstreetmap.org/wiki/Key:width
                    var valueWithoutUnit = getCleanValue(doc.properties.width.width);

                    if (isNaN(valueWithoutUnit)) {
                        //console.log("Lane information is NaN", doc);

                        if (valueWithoutUnit != NaN) {
                            process.exit();
                        };

                    } else {
                        streetWidth = Number(valueWithoutUnit);
                        countWidthOccurences(streetWidth, doc.properties_derived.length, laneInformation);
                    }
                }
            }

            streetArea = streetWidth * streetLength;

            // if (laneInformation.highwayType != 'service') {
            //     if (laneInformation.highwayType == "motorway" && laneInformation.forward == true) {
            //     }else{
            distanceCounter += streetLength;
            //     }
            // }

            areaCounter += streetArea;
            areaCounterOsmAverage += streetLength * laneInformation.numberOfLanes * highwayReference.osmLaneAverage;
            areaCounterOsmAverageAlternative += streetLength * laneInformation.numberOfLanes * highwayReference.osmLaneAverageAlternative;

            consoleOutput += ' | width ' + streetWidth  + " " + streetWidthsReference.unit;
            consoleOutput += ' | length ' + streetLength  + " " + streetWidthsReference.unit;
            consoleOutput += ' | area ' + streetArea + " " + streetWidthsReference.unit + '2';
        }

        process.stdout.write(consoleOutput + '                \r');
    } else {
        return null;
    }
}

function calculateWidthOccurences() {
    for (key in streetWidthOccurences) {
        streetWidthOccurences[key].occurences.averageWidthPerLane = streetWidthOccurences[key].occurences.widthPerLane / streetWidthOccurences[key].occurences.number;
        streetWidthOccurences[key].distance.averageWidthPerLane = streetWidthOccurences[key].distance.widthPerLane / streetWidthOccurences[key].distance.meters;
    }
}

function countWidthOccurences(streetWidth, streetLength, laneInformation) {
    //General Stats
    if (!streetWidthOccurences['general']) {
        streetWidthOccurences['general'] = {
            occurences: {
                number: 0,
                widthPerLane: 0

            },
            distance: {
                meters: 0,
                widthPerLane: 0
            }
        }
    }
    var general = streetWidthOccurences['general'];
    general.occurences.widthPerLane += streetWidth;
    general.occurences.number += 1;
    general.distance.meters += streetLength;
    general.distance.widthPerLane += streetWidth / laneInformation.numberOfLanes * streetLength

    //Breakdown per highway type
    if (!streetWidthOccurences[laneInformation.highwayType]) {
        streetWidthOccurences[laneInformation.highwayType] = {
            occurences: {
                widthPerLane: 0,
                number: 0
            },
            distance: {
                meters: 0,
                widthPerLane: 0
            }
        }
    }
    var highway = streetWidthOccurences[laneInformation.highwayType];
    highway.occurences.widthPerLane += streetWidth;
    highway.occurences.number += 1;
    highway.distance.meters += streetLength;
    highway.distance.widthPerLane += streetWidth / laneInformation.numberOfLanes * streetLength
}

function getCleanValue(string) {
    var output = (string.replace(' m', '')).replace('m', '')
    return output
}

function getLaneInformation(doc) {
    var highwayType = null;
    var numberOfLanes = null;
    var lanes = null;
    var forward = null;
    var backward = null;
    var oneway = false;

    //Source http://wiki.openstreetmap.org/wiki/Key:lanes#Assumptions
    var defaultNumberOfLanes = {
        residential: 2,
        tertiary: 2,
        secondary: 2,
        primary: 2,
        service: 1,
        track: 1,
        path: 1
    };

    var output = {};
    var laneInformation = null;

    if (doc.properties.highway) {
        highwayType = doc.properties.highway.highway;
        numberOfLanes = defaultNumberOfLanes[highwayType] || 2;

        if (doc.properties.lanes) {
            laneInformation = true;
        }

        if (laneInformation) {
            // Get Information if available
            if (doc.properties.lanes.lanes) {
                if (isNaN(doc.properties.lanes.lanes)) {
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    lanes = Number(doc.properties.lanes.lanes);
                }
            }
            if (doc.properties.lanes.forward) {
                if (isNaN(doc.properties.lanes.forward)) {
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    forward = Number(doc.properties.lanes.forward);
                }
            }
            if (doc.properties.lanes.backward) {
                if (isNaN(doc.properties.lanes.backward)) {
                    console.log("Lane information is NaN", doc);
                    process.exit();
                } else {
                    backward = Number(doc.properties.lanes.backward);
                }
            }

            // Get number of lanes
            if (lanes) {
                numberOfLanes = lanes;
            } else if (forward && backward) {
                numberOfLanes = forward + backward;
            } else if (forward) {
                numberOfLanes = forward;
            } else if (backward) {
                numberOfLanes = backward;
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
                        console.log(doc);
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
        }

        // Prepare for tagging errors ... as always
        if (highwayType == "motorway" || highwayType == "trunk") {
            if (oneway == false) {
                // Tagged the wrong way - See http://wiki.openstreetmap.org/wiki/Key:lanes#Assumptions
                // Defaulting to oneway = true;
                oneway = true;
                console.log(doc);
                process.exit();
            }
        }
    }

    output.highwayType = highwayType;
    output.numberOfLanes = numberOfLanes;
    output.forward = forward;
    output.backward = backward;
    output.oneway = oneway;
    return output;
}


function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('Example:');
    console.log('node index.js --mongodb mongodb://username:password@ip:port/db?authSource=admin --collection ways');
    console.log('');
    console.log('--mongodb: The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
    console.log('--collection: [optional] The name of the collection you want to connect to - defaults to ' + defaultCollectionName);
    console.log('--widths: A json file containing the euqaling width of a osm highway');
    console.log('--country: Select a country to pick the right width reference');
}