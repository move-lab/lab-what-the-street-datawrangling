var argv = require('minimist')(process.argv.slice(2));
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

init();

//script will add properties_derived.name with the either the main language or the one you choose if there are multiple options
//run e.g. 'node index.js --url url mongodb://username:pw@ip:port/authentificationDatabase --languages de,en,fr'

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
    var cursor = collection.find();
    
    var languagePreferences = ['en', 'de', 'fr'];
    if (argv.languages) {
        languagePreferences = removeSpaces(argv.languages).split(",");
        console.log('Your language preferences: ' + languagePreferences)
    }else{
        console.log("You did not specify your preffered languages - using default: " + languagePreferences);
        console.log("Specify like '--languages en,de,fr'")
    }

    cursor.each(function(err, item) {
        if(item == null) {
            console.log("All done");
            db.close();
        }else{
            console.log("Updating _id: " + item["_id"]);
            var name = item.properties.name;
            var nameType = typeof(name);
            if (name == undefined) {
                console.log("   [name=undefined] -> Ignoring document");
            }else if (nameType == "object") {
                console.log("   [name=object]");
                var outputName = getRightName(name, languagePreferences);
                if (outputName) {
                    console.log("   Selected name: " + outputName);
                    item.properties_derived.name = outputName;
                    collection.update({_id: item["_id"]}, item);
                };
            }else if (nameType == "string"){
                console.log("   Name is distinct: " + item.properties.name);
                item.properties_derived.name = item.properties.name;
                collection.update({_id: item["_id"]}, item);
            }
        }
  });
}

function getRightName(names, languagePreferences){
    for (var i = 0; i < languagePreferences.length; i++) {
        var language = languagePreferences[i];
        var name = names[language]
        if (name == undefined) {
            console.log('      Could not find language: ' + language)
        }else{
            console.log('      Name returned in language: ' + language)
            return name;
        }
    };
    console.log('      Could not find any name in preffered languages - leaving name empty');
    return null
}

function removeSpaces(str){
    return str.replace(/\s+/g, '');
}