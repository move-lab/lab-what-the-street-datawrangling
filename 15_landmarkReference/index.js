var turf = require('turf');
var path = require('path');
var fs = require('fs');

var data = {
    "berlin": {
        "cars": 1879000,
        "name": "Tempelhofer Feld",
        "coordinates": [13.40229, 52.47357]
    },
    "newyork": {
        "cars": 1879000,
        "name": "Central Park",
        "coordinates": [-73.966461, 40.782029]
    },
    "amsterdam": {
        "cars": 344184,
        "name": "Vondelpark",
        "coordinates": [4.866097, 52.357652]
    },
    "stuttgart": {
        "cars": 348103,
        "name": "Cannstatter Wasen",
        "coordinates": [9.219627, 48.795377]
    },
    "portland": {
        "cars": 469281,
        "name": "Mount Tabor",
        "coordinates": [-122.595235, 45.511827]
    },
    "losangeles": {
        "cars": 2718800,
        "name": "LAX",
        "coordinates": [-118.412458, 33.945271]
    },
    "sanfrancisco": {
        "cars": 379898,
        "name": "Golden Gate Park",
        "coordinates": [-122.488708, 37.768989]
    },
    "boston": {
        "cars": 303604,
        "name": "Boston Common",
        "coordinates": [-71.066375, 42.354950]
    },
    "vienna": {
        "cars": 844911,
        "name": "Schlosspark Schönbrunn",
        "coordinates": [16.308680, 48.180807]
    },
    "copenhagen": {
        "cars": 208007,
        "name": "Christiania",
        "coordinates": [12.610164, 55.677213]
    },
    "barcelona": {
        "cars": 585000,
        "name": "La Barceloneta",
        "coordinates": [2.189496, 41.377270]
    },
    "beijing": {
        "cars": 1663760,
        "name": "Forbidden City",
        "coordinates": [116.396689, 39.917165]
    },
    "budapest": {
        "cars": 589746,
        "name": "Margit-sziget",
        "coordinates": [19.047852, 47.526829]
    },
    "chicago": {
        "cars": 1495450,
        "name": "Navy Pier",
        "coordinates": [-87.604048, 41.891724]
    },
    "helsinki": {
        "cars": 233874,
        "name": "Suomenlinna",
        "coordinates": [24.988903, 60.145098]
    },
    "hongkong": {
        "cars": 455000,
        "name": "Disneyland",
        "coordinates": [114.044096, 22.314993]
    },
    "jakarta": {
        "cars": 2132976,
        "name": "National Monument",
        "coordinates": [106.826518, -6.175446]
    },
    "johannesburg": {
        "cars": 478315,
        "name": "Botanical Gardens",
        "coordinates": [28.000783, -26.157908]
    },
    "london": {
        "cars": 2645570,
        "name": "Hyde Park",
        "coordinates": [-0.166213, 51.507542]
    },
    "moscow": {
        "cars": 4014656,
        "name": "Kolomenskoye Park",
        "coordinates": [37.668747, 55.670160]
    },
    "rome": {
        "cars": 1804749,
        "name": "Roman Forum",
        "coordinates": [12.485044, 41.892410]
    },
    "singapore": {
        "cars": 545299,
        "name": "Sentosa",
        "coordinates": [103.828156, 1.249822]
    },
    "tokyo": {
        "cars": 2465220,
        "name": "Shinjuku Gyoen",
        "coordinates": [139.710534, 35.685054]
    }
}

saveComparisons(data);



// Creates a square (as geojson polygon) around a point with specified area (edges are straight, not along the great circle)
function getSquareAroundPointWithArea(point, area) {
    // Area in m2
    var coordinates = [];
    var areaInKm = area / 1000 / 1000;
    var edgeLength = Math.sqrt(areaInKm);
    var diagonal = Math.sqrt(Math.pow(edgeLength, 2) + Math.pow(edgeLength, 2));

    for (var i = 0; i < 4; i++) {
        var bearing = i * 90 + 45;
        var distance = diagonal / 2;
        var destination = turf.destination(point, distance, bearing);
        coordinates.push(destination.geometry.coordinates);
    }
    coordinates.push(coordinates[0]); // Close Polygon

    var square = turf.polygon([coordinates]);
    return square;
}



function saveComparisons(data) {
    for (city in data) {
        var datum = data[city];
        var cars = datum.cars;
        var point = turf.point(datum.coordinates);
        saveComparison(city, cars, point);
    }
}



function saveComparison(filename, numberOfCars, point) {
    var features = [];
    var carParkingSize = 12;

    var fractionDriving = 0.025;
    var areaOfAllCars = numberOfCars * carParkingSize;
    var areaOfDrivingCars = areaOfAllCars * fractionDriving;

    //Geojson Driving
    var numberOfSquaresDriving = 1;
    var geoJsonSquareDriving = getSquareAroundPointWithArea(point, areaOfDrivingCars);
    features.push(geoJsonSquareDriving);
    
    fs.writeFileSync(path.join('export', filename + '_comparison.geojson'), JSON.stringify(turf.featureCollection(features)));
}