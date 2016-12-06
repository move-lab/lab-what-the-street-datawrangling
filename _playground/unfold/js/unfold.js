var unfold = (function() {
  // Returns coordinates of unfolded street
  //
  //   progress: How far animation has 
  //      From:  0 (start - no change)
  //      To:    1 (end - fully unfolded and rotated that start- and endpoint are on the same y)
  function getUnfoldedCoordinates(street, progress, unfoldFactor){
    var unfoldFactor = 1 + progress * unfoldFactor;
    var scale = 100;

    var unfoldedStreet = getUnfoldedStreet(street, unfoldFactor, progress, progress);
    var unfoldedStreetCoordinates = getCoordinatesFromVectors(unfoldedStreet.vectors, unfoldedStreet.origin);
    var lastCoordinate = unfoldedStreetCoordinates[ unfoldedStreetCoordinates.length - 1 ];
    var objectBearing = getBearing( street.origin, lastCoordinate );
    unfoldedStreet.objectBearing = objectBearing;
    var rotate = -getAngleDifference(unfoldedStreet.objectBearing, 90);
    return getStreetCoordinates(unfoldedStreet.vectors, scale, rotate * progress);
  }

  function getStreetCoordinates(vectors, scale, rotation){
    var output = [];
    var bearingCounter = rotation;
    var currentX = 0;
    var currentY = 0;
    var previousX = currentX;
    var previousY = currentY;

    var distanceCounter = 0;
    var kmInPixel = scale; //= 1km
    var lastBendYTest = 0;
    var lastAction = "";
    for (var i = 0; i < vectors.length; i++) {
      var vector = vectors[i];
      bearingCounter += vector.deltaBearing;
      distanceCounter += vector.distance;

      //not correct, better use turf.destination() instead
      var dx = Math.sin(toRadians(bearingCounter)) * vector.distance;
      var dy = Math.cos(toRadians(bearingCounter)) * vector.distance;

      currentX += dx;
      currentY -= dy;
   
      output.push({distance: distanceCounter, y: currentY});

      previousX = currentX;
      previousY = currentY;
    };
    return output;
  }


  // Returns the street object with original structure, but unfolded according to input properties
  //
  //   closeGaps: How much gaps should be closed (for streets which split up)
  //      From:  0 (original gap)
  //      To:    1 (no gap)
  //      Larger numbers will result in larger gaps (don't use larger numbers)
  //
  //   unfold: How much the street path should be unfolded
  //      From:  1 (original path)
  //      To: infinity (values between 5 and 15 give a good, but still curvy result)
  //
  //   straightenPathConnections: 
  //      From:  0 (original angle) 
  //      To:    1 (the end of one vector will be the start of another one)

  function getUnfoldedStreet(street, unfold, closeGaps, straightenPathConnections){
    closeGaps = 1 - closeGaps;
    straightenPathConnections = 1 - straightenPathConnections;

    var previousVectorType;
    var newVectors = JSON.parse(JSON.stringify(street.vectors)); //copy vectors

    for (var i = 0; i < newVectors.length; i++) {
      var vector = newVectors[i];

      //If type vector is translation (should not be drawn)
      if (vector.type == "translation") {
        vector.deltaBearing = vector.deltaBearing * closeGaps;
        vector.distance = vector.distance * closeGaps;
      }

      //For all vectors except the first one
      if (i!=0) {
        vector.deltaBearing = vector.deltaBearing / unfold;
        if (previousVectorType == "translation") {
          vector.deltaBearing = vector.deltaBearing * straightenPathConnections;
        }
      }

      //Last Vector
      //if (i == newVectors.length - 1) {};

      previousVectorType = vector.type;
    };

    var newStreet = {
      origin: JSON.parse(JSON.stringify(street.origin)),
      tags: JSON.parse(JSON.stringify(street.tags)),
      vectors: newVectors
    }
    
    return newStreet;
  }


  // Converts coordinates based street into vector based
  function getVectorLine(street){
    var components = street.components;
    var previousNode;
    var previousBearing;

    var output = {};
        output.tags = street.tags;
        output.vectors = [];

    for (var c = 0; c < components.length; c++) {
      var component = components[c];
      var paths = component;

      for (var p = 0; p < paths.length; p++) {
        var path = paths[p];

        for (var n = 0; n < path.length; n++) {
          var node = path[n];

          //If first node of everything, then set origin and don't create vector (since a vector needs two nodes)
          if (c==0 && p==0 && n==0) {
            //Set Origin
            var currentNodeLocation = street.nodes[node];
            output.origin = currentNodeLocation;
          }else{
            //Add Vector (gaps are also vectors)
            var type;
            var deltaBearing;
            var currentNodeLocation = street.nodes[node];
            var previousNodeLocation = street.nodes[previousNode];

            var bearing = getBearing( previousNodeLocation, currentNodeLocation ); //in deg
            var distance = getDistance( previousNodeLocation, currentNodeLocation ); //in km

            //If it is the first vector, use the globale bearing, since it compares to the y-axis
            if (c==0 && p==0 && n==1) { //if second node (first vector) of everything
              deltaBearing = bearing;
            }else{
              deltaBearing = getAngleDifference( bearing, previousBearing );
            }

            //If first node of path (n==0), then the vector ending here is translation
            if (n==0) { type = "translation";
            }else{      type = "street";    }

            //If last node of everything, then add destination and bearing of the object
            if (p == paths.length -1 && n == path.length - 1 && c == components.length - 1) { 
              output.destination = currentNodeLocation;
              output.objectBearing = getBearing( output.origin, output.destination );
            };

            //Prepare to output
            var vector = {
              deltaBearing: deltaBearing,
              distance: distance,
              type: type
            }
            output.vectors.push(vector);

            //Update previous bearing (used to calculate the bearing difference)
            previousBearing = bearing;
          }

          //Update previous node (used to calculate the vectors)
          previousNode = node;
        };
      };
    };
    return output;
  }


  // Returns an array containing the coordinates of 
  function getCoordinatesFromVectors(vectors, origin){
    var coordinates = [];
    var bearingCounter = 0;

    //First coordinate
    var cursor = JSON.parse(JSON.stringify(origin));
    coordinates.push(cursor);

    for (var i = 0; i < vectors.length; i++) {
      var vector = vectors[i];
      bearingCounter += vector.deltaBearing;
      cursor = getDestination(cursor, vector.distance, bearingCounter);

      coordinates.push(cursor);
    };

    return coordinates;
  }


  // Returns the closest angular difference between two angles (between -180 and 180)
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


  // Helper script to get bearing between two points using turf
  function getBearing(from, to){
    var fromPoint = turf.point([from.lon, from.lat]);
    var toPoint = turf.point([to.lon, to.lat]);
    return turf.bearing(fromPoint, toPoint);
  }


  // Helper script to get distance between two points using turf
  function getDistance(from, to){
    var fromPoint = turf.point([from.lon, from.lat]);
    var toPoint = turf.point([to.lon, to.lat]);
    return turf.distance(fromPoint, toPoint);
  }


  // Helper script to get destination from a point using turf
  function getDestination(from, distance, bearing){
    var fromPoint = turf.point([from.lon, from.lat]);
    var toPoint = turf.destination(fromPoint, distance, bearing);
    return {lon: toPoint.geometry.coordinates[0], lat: toPoint.geometry.coordinates[1]}
  }


  // Converts degrees into radians
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  };

  return {
    getVectorLine : getVectorLine,
    getUnfoldedStreet : getUnfoldedStreet,
    getUnfoldedCoordinates : getUnfoldedCoordinates,
    getCoordinatesFromVectors : getCoordinatesFromVectors,
  }
})()