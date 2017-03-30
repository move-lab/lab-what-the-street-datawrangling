var argv = require('minimist')(process.argv.slice(2));
var mongodb = require('mongodb');

var entireArea = 0;
var entireLength = 0;
var longestPieces = [];
var saveNumberOfPieces = 10;


main();

function main() {
    printInstructions();
    if (argv.mongodb && argv.collection) { 
        printProgressStart();
        startProcess(); 
    }else{
        console.log('Please define --mongodb and --collection to start the process');
    }
}

function startProcess() {
    var MongoClient = mongodb.MongoClient;
    MongoClient.connect(argv.mongodb, function(err, db) {
        if (err) {
            reject(Error(err));
        }
        console.log();
        console.log('   Summing up ...');
        var collection = db.collection(argv.collection);
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
            console.log('Entire Area: ' + entireArea);
            console.log('Entire Length: ' + entireLength);
            console.log();
            console.log('Longest Segments: ');
            longestPieces = sortByKey(longestPieces, 'length');
            console.log(JSON.stringify(longestPieces));
            console.log();
            db.close();
        });
    });
}

function printInstructions(){
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
    console.log('      node index.js --mongodb mongodb://127.0.0.1:27017/berlin_coiled --collection streets')
    console.log();
    console.log('     --collection: The name of the collection you want to get information from');
    console.log('     --mongodb: [optional] The connection to the source mongoDB as url. E.g.: mongodb://username:password@ip:port/db?authSource=admin');
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