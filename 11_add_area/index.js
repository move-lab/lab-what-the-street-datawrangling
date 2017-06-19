var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var collectionName;
var waysCollectionName;

var mobilityKind;
var fileName;
var lastLetter = '';

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
        fileName = getCityName() + '_' + collectionName + '.html';
        fs.writeFileSync( path.join(__dirname, 'export', fileName), getHtmlStart());
        fs.appendFileSync(fileName, '<h1>' + getCityName() + ': ' + collectionName + '</h1');
        fs.appendFileSync(fileName, '<table>');


        iterate(argv.mongodb);
    }
}

function getHtmlStart() {
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (getCityName() + ': ' + collectionName) + '</title><style>h2{ margin-bottom: 0.5rem;margin-top: 4rem;} body{font-family: sans-serif; margin: 8rem; padding: 0; text-align:left;} tr:nth-child(even) {background-color: #FAFAFA;} th{font-weight: 400; color: #000; padding: 10px 30px 10px 0;} a:visited{color: #A6C4FF;} a:link{text-decoration: none; color: #FF6819; }</style></head><body>'
}

function getHtmlEnd() {
    return '</body></html>';
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
                    fs.appendFileSync(fileName, '</table>');
                    fs.appendFileSync(fileName, getHtmlEnd());
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
                        if (waysCursor.properties_derived && waysCursor.properties_derived.areaEstimate[mobilityKind]) {
                            areaCounter += waysCursor.properties_derived.areaEstimate[mobilityKind];

                            if (areaCounter == null) {
                                throw way;
                            }
                        }
                        setImmediate(callback);
                    });

                }, function() {
                    if (areaCounter === 0) {
                        console.log();
                        console.log('It appears that the ways attribute is not present in the data');
                        console.log();
                    };
                    stdout('      ' + doc.tags.name + ' (area = ' + areaCounter + ' m2)');
                    doc.tags.area = areaCounter;


                    var coord = getMiddleOfArray(objectToArray(doc.nodes));
                    var url = getGoogleMapsLink(coord.lat, coord.lon);
                    //var urlName = doc.tags.name || ('id:' + doc._id);
                    var urlName = doc.tags.name;
                    if (urlName === '') {
                        urlName = String(doc._id);
                    }
                    var averageWidth = doc.tags.area / doc.tags.length;
                    var currentLetter = urlName.charAt(0);

                    var html = '';

                    if (currentLetter !== lastLetter) {
                        lastLetter = currentLetter;
                        html += '</table>\n'
                        html += '<h2>' + currentLetter + '</h2>\n'
                        html += '<table>\n'
                    }

                    html += '<tr>\n'
                    html += '<th><a target="_blank" href="' + url + '">' + urlName + '</a></th>\n';
                    html += '<th>' + Math.round(averageWidth * 100) / 100 + ' m</th>\n'
                    html += '</tr>\n'

                    fs.appendFileSync(fileName, html);


                    collection.update({ _id: doc["_id"] }, doc);
                    cursor.resume();
                });
            });
        }
    });
}

function getGoogleMapsLink(lat, lon, zoomlevel) {
    zoomlevel = zoomlevel || '70m'
    return 'https://www.google.de/maps/@' + lat + ',' + lon + ',' + zoomlevel + '/data=!3m1!1e3';
}

function getMiddleOfArray(arr) {
    var middleIndex = Math.floor(arr.length / 2);
    return arr[middleIndex];
}

function objectToArray(obj) {
    return Object.keys(obj).map(function(key) {
        return obj[key]; });
}

function printInstructions() {
    console.log('');
    console.log('--------------');
    console.log('  HOW TO RUN  ');
    console.log('--------------');
    console.log('');
    console.log('   Example:');
    console.log('   node index.js --mongodb mongodb://127.0.0.1:27017/berlin_derived --collection railtracks');
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

function getCityName() {
    var pathPieces = argv.mongodb.split('/');
    var cityName = pathPieces[pathPieces.length - 1];
    cityName = cityName.replace('_derived', '');
    return cityName;
}

function getTimeStamp() {
    return Math.round(new Date().getTime() / 1000)
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