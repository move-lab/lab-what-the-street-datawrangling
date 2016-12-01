var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

init();

function init(){
    if (argv.url != null && argv.url != true) {
        connectToMongoDB(argv.url); 
    }else{
        console.log("Please specify the url to connect to. E.g. '--url mongodb://username:pw@ip:port/authentificationDatabase'")
        console.log("See https://moovel.atlassian.net/wiki/display/COPS/LAB+MongoDB+OSM for credentials");
    }
}

function connectToMongoDB(url){
    console.log('Connecting to ' + url)
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        iterateOverCollection(db, 'ways');
    });
}

function iterateOverCollection(db, collectionName){
    console.log("Collection: " + collectionName);
    var collection = db.collection(collectionName);
    var cursor = collection.find({ "properties_derived.name": { $exists: true, $ne: null } , "properties.highway": {"$in":["motorway","trunk","primary","secondary","tertiary","unclassified","residential","living_street","road"]}}).sort({ "properties_derived.name": 1 })
    //var cursor = collection.find({"properties.highway": {"$in":["motorway","trunk","primary","secondary","tertiary","unclassified","residential","living_street","road"]}}).sort({ "properties_derived.name": 1 })
    var output = '"osmID","name","highway","length","lanes"\n';
    cursor.each(function(err, item) {
        if(item == null) {
            save("residential_streets.csv", output);
            console.log("All done");
            db.close();
        }else{
            var name = item.properties_derived.name || "";
            var length = item.properties_derived.length;
            var highway = item.properties.highway;
            var lanes = item.properties.lanes || 1;
            var csv = item["_id"] + ',"' + name + '",' + highway + ',"' + length + '",' + lanes + '\n';
            output += csv;
            console.log(csv);
        }
    });
}

function save(fileName, content){
    fs.writeFile(fileName, content, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });  
}


function removeSpaces(str){
    return str.replace(/\s+/g, '');
}