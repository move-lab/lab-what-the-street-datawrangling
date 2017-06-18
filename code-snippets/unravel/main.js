var map;
var meterPerPixel = 1.2672955975;
var coilPadding = [20, 20];

init();  

function init() {
    setupMap();
}

function setupClickListeners() {
    $('#coil #15').click(function() { streetClicked() });
}

function setupMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYm9nbmVyc3RlcGhhbiIsImEiOiJBMnlqbnZrIn0.YwiGRgpheNMPujZn-JBh6Q';
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
        center: [-74.50, 40], // starting position
        zoom: 9 // starting zoom
    });

    map.on('load', function() {
        addSource('street');
        setupClickListeners();
    });
}


function streetClicked() {
    $.getJSON("data/mongoEntry.json", function(data) { // Instead of loading the json, you would load data from the server here

        // Transition
        $('#content').addClass('invisible');
        $('#map').removeClass('fade');

        var coiled = data.coiled;
        var original = data.original;
        var properties = data.properties;

        var offsetY = $('#coil').offset().top - $('#map').offset().top; // Distance between the top edge of the svg and the top edge of the map
        var offsetX = Number($('#coil').css("marginLeft").replace('px', '')); // Distance between the left edge of the map and the left edge of the svg
        var zoomLevel = getZoomLevel(properties.origin.lat, meterPerPixel); // Calculate zoom level, since zoom level equals different scales on different places on earth
        map.setZoom(zoomLevel); // Set map zoom level

        // Set map
        var x = coilPadding[1] / 2 + offsetX + coiled.coilOrigin.x / (meterPerPixel / 1000); // Find where the start of the selected street on the coil is on the screen ...
        var y = coilPadding[0] / 2 + offsetY + coiled.coilOrigin.y / (meterPerPixel / 1000);
        var percentagePixelHor = (x / $('#map').width()); // ... and where that coordinate is relative to the map
        var percentagePixelVer = (y / $('#map').height());
        var mapPivot = [properties.origin.lon, properties.origin.lat]; // Set where the map pivot should be ...
        centerAt(map, mapPivot, percentagePixelHor, percentagePixelVer); // ... and move it to the location where the street starts on the coil
        var bounds = [original.bounds.ne, original.bounds.sw]; // Now zoom out ...
        var geoJson = unfold.geoJsonStreetAnimation(original, coiled, properties.origin, 0, 0); // ... and display it on the map
        map.getSource('street').setData(geoJson);

        window.setTimeout(function() {
            window.setTimeout(function() {
                map.fitBounds(bounds, {
                    maxZoom: zoomLevel,
                    padding: 30,
                    speed: 0.3
                });
            }, 500);


            map.on('moveend', function() {
                animate(data.original, coiled, properties);
            })
        }, 700);
    });
}

function animate(vectorStreet, coiledStreet, properties) {
    var timeUnravel = calculateBendWay(vectorStreet.vectors) * 200000; // This depends on how much movement is in the street geometry
    var timeTransform = getLongestTranslation(vectorStreet.vectors) * 200000; // This depends on how long the biggest translation is (when a street consists of multiple segments)
    var transformDelay = 200;
    if (timeTransform < 100) { transformDelay = 0; } // When a street consists of only piece/pieces are very close together, remove the delay

    var geoJson = unfold.geoJsonStreetAnimation(vectorStreet, coiledStreet, properties.origin, 0, 0); // Get geometry as geojson
    map.getSource('street').setData(geoJson); // Plot on map
    $({
        progressUnfold: 0
    }).delay(200).animate({
        progressUnfold: 1
    }, {
        duration: timeUnravel,
        easing: "easeOutBounce",
        progress: function(animation, progress) {
            var geoJson = unfold.geoJsonStreetAnimation(vectorStreet, coiledStreet, properties.origin, this.progressUnfold, 0);
            map.getSource('street').setData(geoJson);
        },
        complete: function(argument) {
            $({
                progressStitch: 0
            }).delay(transformDelay).animate({
                progressStitch: 1
            }, {
                duration: timeTransform,
                easing: "easeInOutBack",
                progress: function(animation, progress) {
                    var geoJson = unfold.geoJsonStreetAnimation(vectorStreet, coiledStreet, properties.origin, 1, this.progressStitch);
                    map.getSource('street').setData(geoJson);
                }
            });
        }
    });
}


function addSource(name) {
    map.addSource(name, {
        "type": "geojson",
        "data": {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-122.48369693756104, 37.83381888486939],
                    [-122.48348236083984, 37.83317489144141]
                ]
            }
        }
    });
    map.addLayer({
        "id": name,
        "type": "line",
        "source": name,
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#000",
            "line-width": 5
        }
    });
}

$.easing.easeOutBounce = function(x, t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
        return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
}