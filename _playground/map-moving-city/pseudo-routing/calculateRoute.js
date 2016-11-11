var fs = require('fs');
var turf = require('turf')

function filterNulls(feat){
	if(feat.properties.name != null){
		return feat;
	}
}



function flattenCoordinates(feat){
	var output = []
	if(feat.geometry.type == "MultiLineString"){
		feat.geometry.coordinates.forEach(function(d){
			d.forEach(function(i){
				output.push(i);
			})
		})
	}
	return output;
}




fs.readFile('berlin-roads-dissolve-name.geojson', 'utf8', function(err, data) {
    if (err) throw err; // we'll not consider error handling for now
    var obj = JSON.parse(data);

    // filter out the nulls - for now (creates weird gaps in data, but...)
    console.log(obj.features.length);
    obj.features = obj.features.filter(filterNulls);

   var output = [];
   obj.features.forEach(function(d){
   	var temp = flattenCoordinates(d);
   	output.push(temp);
   }); 

    // write the file out
    fs.writeFile("test.json", JSON.stringify(output), function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("File Saved!");
    });
});



// for each road:
    // + sort the road coordinates by longitude or latitude
    // + then for each road "drive" a car along the road at a random point along the line
    // + when the "car" drives to the end of the line, then turn around
    // + or at some point allow the car to drive onto a road which intersects it


