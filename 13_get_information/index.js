var argv = require('minimist')(process.argv.slice(2));
var mongodb = require('mongodb');
var async = require('async');
var fs = require('fs');

var saveNumberOfPieces = 10;
var cityMetaDataJson;

var citiesDefault = ["berlin", "newyork", "amsterdam", "stuttgart", "portland", "losangeles", "sanfrancisco", "boston", "vienna", "copenhagen", "barcelona", "beijing", "budapest", "chicago", "helsinki", "hongkong", "jakarta", "johannesburg", "london", "moscow", "rome", "singapore", "tokyo", "amsterdam"]
var cities;

var fileNameLUT = {
    'streets': 'car-tracks',
    'railtracks': 'rail-tracks',
    'railtracksparking': 'rail-parking',
    'biketracks': 'bike-tracks'
}

var mobilityLut = {
    'streets': 'car',
    'railtracks': 'rail',
    'railtracksparking': 'rail',
    'biketracks': 'bike'
}

main();


function main() {
    printInstructions();
    cities = argv.cities || citiesDefault;
    if (argv.cities) {
        cities = cities.split(',');
    }

    if (!argv.meta) {
        console.log('Please specify the location of your citymetadata.json');
    } else {

        fs.readFile(argv.meta, function(err, data) {
            if (err) throw err;
            cityMetaDataJson = JSON.parse(data);

            async.mapSeries(cities,
                function(cityName, callback) {
                    var mongoUrl = 'mongodb://127.0.0.1:27017/' + cityName + '_coiled'
                    console.log();
                    console.log();
                    console.log();
                    console.log('-------------------------------');
                    console.log(cityName + ' ' + cityName + ' ' + cityName);
                    console.log('-------------------------------');
                    async.mapSeries(['biketracks', 'railtracks', 'railtracksparking', 'streets'],
                        function(collName, callback) {
                            startProcess(cityName, mongoUrl, collName, callback);
                        },
                        function(err) {
                            callback();
                        }
                    );
                },
                function() {
                    var newMetaData = argv.meta.replace('.json', '') + '_new.json';
                    fs.writeFileSync(newMetaData, JSON.stringify(cityMetaDataJson, null, 4));
                    console.log('An updated citymetadata.json was saved at ' + newMetaData);
                }
            );
            console.log(data);
        });
    }
}

function startProcess(cityName, mongoUrl, collectionName, callback) {
    var longestPieces = [];
    var entireLength = 0;
    var entireArea = 0;
    console.log('Getting data for ' + cityName);
    var MongoClient = mongodb.MongoClient;
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log(' It looks like ' + collectionName + ' does not exist');
            callback();
        } else {
            var collection = db.collection(collectionName);
            var cursor = collection.find({});

            cursor.on('data', function(doc) {
                if (doc && doc.properties) {
                    if (doc.properties.length) {
                        var l = Number(doc.properties.length);
                        entireLength += l;

                        longestPieces = sortByKey(longestPieces, 'length');
                        if (longestPieces[saveNumberOfPieces - 1] && longestPieces[saveNumberOfPieces - 1].length >= l) {
                            // Current thing is shorter
                        } else {
                            longestPieces.push({
                                'length': l,
                                'name': doc.properties.name,
                                'id': doc._id
                            });
                            longestPieces = sortByKey(longestPieces, 'length');
                            if (longestPieces.length > saveNumberOfPieces) {
                                longestPieces.pop();
                            }
                        }

                        //console.log('Length: ' + l);
                    }
                    if (doc.properties.area) {
                        var a = Number(doc.properties.area);
                        entireArea += a;
                        //console.log('Area: ' + a);
                    }
                };
            });

            cursor.on('end', function() {
                console.log();
                console.log('------------------');
                console.log('    ' + collectionName);
                console.log('------------------');
                console.log('"area": ' + Math.round(entireArea) + ',');
                console.log('"length": ' + Math.round(entireLength) + ',');
                console.log();
                longestPieces = sortByKey(longestPieces, 'length');
                console.log('"longestStreets": ' + JSON.stringify(longestPieces));

                var mobilityType = fileNameLUT[collectionName];
                if (mobilityType === 'car-tracks') {
                    cityMetaDataJson[cityName].streets.longestStreets = longestPieces; // add longeststreets
                }

                if (mobilityType === 'car-tracks' || mobilityType === 'bike-tracks' || mobilityType === 'rail-tracks') {
                    cityMetaDataJson[cityName].moving[mobilityLut[collectionName]].area = Math.round(entireArea);
                    cityMetaDataJson[cityName].moving[mobilityLut[collectionName]].length = Math.round(entireLength);
                }
                if (mobilityType === 'rail-parking') {
                    cityMetaDataJson[cityName].parking[mobilityLut[collectionName]].area = Math.round(entireArea);
                    cityMetaDataJson[cityName].parking[mobilityLut[collectionName]].length = Math.round(entireLength);
                }

                db.close();
                callback();
            });
        }
    });
}

function printInstructions() {
    console.log();
    console.log('--------------');
    console.log('      ABOUT  ');
    console.log('--------------');
    console.log();
    console.log('   This iterates over all streets/rails from {cityname}_coiled and outputs longest streets and combined area and length');
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log();
    console.log('   Example:');
    console.log('      node index.js --meta location/of/citymetadata.json --cities hongkong,berlin')
    console.log();
    console.log('      --meta: Location of your citymetadata.json file');
    console.log('      --cities: [Optional] The cities you want to analyze - defaults to analyze all cities (' + citiesDefault.join(', ') + ')');
    console.log();
}

function printProgressStart() {
    console.log();
    console.log('--------------');
    console.log('   PROGRESS      ');
    console.log('--------------');
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}