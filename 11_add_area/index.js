var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var collectionName;
var waysCollectionName;

var mobilityKind;

main();

function main() {
    printInstructions();
    if (argv.mongodb && argv.collection) {
        collectionName = argv.collection;
        waysCollectionName = argv.ways || 'ways';

        printActiveSettings();
        printProgressStart();
        console.log();
        console.log('   1. Iterating over Collection');
        iterate(argv.mongodb);
    }
}

function iterate(mongoUrl) {
    stdout('      Connecting to mongodb ' + mongoUrl);
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            stdout('      Connection successful');
            var collection = db.collection(collectionName);
            if (collectionName === 'railtracksparking') {
                mobilityKind = 'rail';
            } else if (collectionName === 'railtracks') {
                mobilityKind = 'rail';
            } else if (collectionName === 'streets') {
                mobilityKind = 'car';
            } else if (collectionName === 'biketracks') {
                mobilityKind = 'bike';
            }
            var waysCollection = db.collection(waysCollectionName);
            var cursor = collection.find({});

            cursor.once('end', function() {
                stdout('      Finishing updating MongoDB');
                setTimeout(function() {
                    db.close();
                    stdout('      Done');
                    printSummary();
                }, 4000)
            });

            cursor.on('data', function(doc) {
                cursor.pause();
                var areaCounter = 0;

                async.eachSeries(doc.ways, function iteratee(way, callback) {
                    waysCollection.findOne({ '_id': way }, function(err, waysCursor) {
                        if (waysCursor.properties_derived && waysCursor.properties_derived.area[mobilityKind]) {
                            areaCounter += waysCursor.properties_derived.area[mobilityKind];
                        }
                        setImmediate(callback);
                    });

                }, function() {
                    stdout('      ' + doc.tags.name + ' (area = ' + areaCounter + ' m2)');
                    doc.tags.area = areaCounter;
                    collection.update({ _id: doc["_id"] }, doc);
                    cursor.resume();
                });
            });
        }
    });
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('   node index.js --mongodb mongodb://username:password@ip:port/db?authSource=admin --collection railtracks');
    console.log('');
    console.log('   --mongodb: The connection to the mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
    console.log('   --collection: [required] The name of the collection you want to connect to');
    console.log('   --ways: [optional] The name of the ways collection containing the area information - defaults to \'ways\'');
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
    console.log('   - ways collection: ' + waysCollectionName);
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
}