//170504

//If you want a certain LatLon to be at a certain position of the map
//   map:                Map element
//   center:             The point you want to position somewhere
//   fractionFromLeft:   Value from 0 to 1 where the point should be located in the map view horizontally
//   fractionFromTop:  Value from 0 to 1 where the point should be located in the map view vertically

function centerAt(map, center, fractionFromLeft, fractionFromTop){
    map.setCenter(center);
    var bounds = map.getBounds();
    var dLat = bounds._ne.lat - bounds._sw.lat;
    var dLon = bounds._ne.lng - bounds._sw.lng;

    var offsetLat = - 0.5 + fractionFromTop;
    var offsetLon = - 0.5 + fractionFromLeft;

    var center = map.getCenter();

    var newLat = center.lat + offsetLat * dLat;
    var newLon = center.lng - offsetLon * dLon;
    map.setCenter([newLon, newLat]);
}

function getMeterPerPixel(lat, zoomLevel){
    return (40075016.686 * Math.abs(Math.cos(toRadians(lat))) / Math.pow(2, zoomLevel + 9));
}

function getZoomLevel(lat, meterPerPixel){
    return Math.log2(40075016.686 * ( Math.cos(toRadians(lat))/meterPerPixel )) - 9;
}

function getAngleDifference(angle1, angle2){
	var d = angle1 - angle2
	while (d < -180) {
		d += 360;
	};
	while (d > 180) {
		d -= 360;
	};
	return d;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateBendWay(vectors){
    var entireBendWay = 0;
    for (var i = 0; i < vectors.length; i++) {
        var vector = vectors[i];
        var vectorLength = vector.distance;
        var deltaAngle = vector.deltaBearing || vector.deltaAngle;
        var radius = vectorLength;
        var circumference = radius * 2 * Math.PI;
        var circleFraction = circumference/360*deltaAngle;
        var bendWay = Math.abs(circleFraction);
        entireBendWay += bendWay;
        if (isNaN(entireBendWay)) {
            console.log(i);
        };
    }
    return entireBendWay;
}

function getLongestTranslation(vectors){
    var longestTranslation = 0;
    for (var i = 0; i < vectors.length; i++) {
        var vector = vectors[i];
        var vectorLength = vector.distance;
        if (vector.type !== 'street') {
            if (vectorLength > longestTranslation) {
                longestTranslation = vectorLength;
            }
        }
    }
    return longestTranslation;
}