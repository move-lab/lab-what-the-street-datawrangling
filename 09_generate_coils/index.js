var fs = require('fs');
var dir = require('node-dir');
var turf = require('turf');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');

require('../scripts/helpers.js');
require('../scripts/coil.js');
require('../scripts/unfold.js');

var widthInMeter;
var defaultWidthInMeter = 729;
var widthInPixels;
var defaultWidthInPixels = 592;
var gapBetweeStreets; //in km
var defaultGapBetweeStreets = 0.005;
var debugLimitStreets;
var defaultDebugLimitStreets = null;

var counter = 0;
var numberOfFiles;

var jsonToSave = [];
var pretty;

main();

function main() {
    widthInMeter = argv.widthInMeter || defaultWidthInMeter;
    widthInPixels = argv.widthInPixels || defaultWidthInPixels;
    gapBetweeStreets = argv.gapBetweeStreets || defaultGapBetweeStreets;
    debugLimitStreets = argv.debugLimitStreets || defaultDebugLimitStreets;
    pretty = argv.pretty || true;

    console.log("");
    console.log("Parameters:");
    console.log("   widthInMeter: " + widthInMeter);
    console.log("   widthInPixels: " + widthInPixels);
    console.log("   gapBetweeStreets: " + gapBetweeStreets);
    console.log("   pretty: " + pretty);
    console.log("   debugLimitStreets: " + debugLimitStreets);
    console.log("");

    console.log("Process:");

    if (argv.json) {
        numberOfFiles = 1;
        async.detectSeries([argv.json], coilStreets, function(err, result) {
            console.log('');
            console.log('All streets were successfully coiled and exported.');
            console.log('');
        })
    } else if (argv.dir) {
        dir.readFiles(argv.dir,
            {match: /.json$/},
            function(err, content, next) {
                if (err) throw err;
                //console.log('content:', content);
                next();
            },
            function(err, files) {
                if (err) throw err;
                numberOfFiles = files.length;
                async.detectSeries(files, coilStreets, function(err, result) {
                    console.log('');
                    console.log('All streets were successfully coiled and exported.');
                    console.log('');
                });
            }
        );
    } else {
        printInstructions();
    }
}

function printInstructions() {
    console.log("");
    console.log("   Please specify input file like following:");
    console.log("   node index.js --json path/to/file.json --widthInMeter 729 --widthInPixels 592 --gapBetweeStreets 0.005");
    console.log("");
    console.log("   [Optional] dir: Path to multiple json files (graph)");
    console.log("   [Optional] json: Path to your json file (graph)");
    console.log("   Either --dir or --json is necessary");
    console.log("   [Optional] widthInMeter: Width of the street coil in meters (scale) - default: " + defaultWidthInMeter);
    console.log("   [Optional] widthInPixels: Width of the street coil in pixels (scale) - default: " + defaultWidthInPixels);
    console.log("   [Optional] gapBetweeStreets: Gap between the individual streets in km - default: " + defaultGapBetweeStreets);
    console.log("   [Optional] pretty: Formats the output json file - default: true");
    console.log("   [Debug] debugLimitStreets: Limit how many streets should get coiled");
    console.log("");
}

function coilStreets(file, callback) {
    console.log('   [' + (counter +1) + '/' + numberOfFiles + '] Coiling ' + file);
    fs.readFile(file, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            var streets = JSON.parse(data);
            meterPerPixel = widthInMeter / widthInPixels;

            var coiledStreets = [];
            //var vectorStreets = [];

            var positionOnCoilCounter = 0;
            for (var i = 0; i < streets.length; i++) {
                coil.setProperties(widthInMeter, 5)
                var street = streets[i];

                var vectorStreet = unfold.getStreetWithVectors(street);
                var vectorStreetDivided = unfold.subdivideVectorStreet(vectorStreet, 1);

                var coiledStreet = coil.getCoiledStreet(vectorStreetDivided, positionOnCoilCounter);
                positionOnCoilCounter += (coiledStreet.coilEnd - coiledStreet.coilStart)
                positionOnCoilCounter += gapBetweeStreets;

                coiledStreets.push(coiledStreet);
                //vectorStreets.push( vectorStreetDivided );

                if (i > debugLimitStreets && debugLimitStreets != null) {
                    break;
                };


                // Remove Redundancy
                var coiledStreetToPush = JSON.parse(JSON.stringify(coiledStreet));
                delete coiledStreetToPush.tags;
                delete coiledStreetToPush['_id'];

                var vectorStreetDividedToPush = JSON.parse(JSON.stringify(vectorStreetDivided));
                delete vectorStreetDividedToPush.tags;
                delete vectorStreetDividedToPush['_id'];

                // Store
                var toPush = {
                    '_id': coiledStreet['_id'],
                    'properties': {
                        'name': coiledStreet.tags.name,
                        'length': coiledStreet.tags.length,
                        // 'area': coiledStreet.tags.area
                        'area': Math.random()*900 + 600
                    },
                    'coiled': coiledStreetToPush,
                    'original': vectorStreetDividedToPush
                };
                jsonToSave.push(toPush);
                console.log('added ' + toPush['_id']);
            };

            var svgCode = coil.generateSvg(coiledStreets, meterPerPixel)

            //var name = "test";
            var name = path.basename(file, path.extname(file));
            var saveAs = path.join(__dirname, "export", name);
            var prettyA = null;
            var prettyB = 4;

            if (pretty == false) {
                prettyA = null;
                prettyB = null;
            }

            console.log('Saving json');
            fs.writeFile(saveAs + ".json", JSON.stringify(jsonToSave, prettyA, prettyB), function(err) {
                if (err) {
                    return console.log(err);
                }

                fs.writeFile(saveAs + ".svg", svgCode, function(err) {
                    if (err) {
                        return console.log(err);
                    }

                    //console.log("    Coiled and saved");
                    counter ++;
                    callback();
                });
            });
        }
    });
}