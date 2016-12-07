var unfold = (function() {
  function rotateVectorStreet(vectorStreet, bearing){
    vectorStreet.vectors[0].deltaBearing += bearing;
  }

  function setRotationOfVectorStreet(vectorStreet, bearing){
    vectorStreet.vectors[0].deltaBearing = bearing;
  }

  function getObjectBearing(vectorStreet){
    var street = getStreetWithCoordinates(vectorStreet);
    var coordinates = street.coordinates;
    var lastCoordinate = coordinates[ coordinates.length - 1 ];
    var objectBearing = getBearing( vectorStreet.origin, lastCoordinate );
    return objectBearing;
  }

  function calculateAndSetObjectBearing(vectorStreet){
    vectorStreet.objectBearing = getObjectBearing(vectorStreet);
  }

  function getDistanceInPixels(meter, meterPerPixel){
    return meter * 2 / meterPerPixel; //e.g. you have 2 meters distance, and one pixel equals 4 meters, than it returns 0.5 pixel
  }

  function getStreetWithCoordinates(vectorStreet){
    //preparing output
    var output = JSON.parse( JSON.stringify(vectorStreet) );
        output.coordinates = [];
        delete output.vectors;
        delete output.destination;
        delete output.objectBearing;

    var vectors = vectorStreet.vectors;
    var bearingCounter = 0;

    var cursor = output.origin;

    for (var i = 0; i < vectors.length; i++) {
      var vector = vectors[i];
      bearingCounter += vector.deltaBearing;

      if (i == 0) { //First vector
        output.coordinates.push(cursor);//First coordinate
      } 

      //Move cursor forward
      cursor = getDestination(cursor, vector.distance, bearingCounter);
      output.coordinates.push(cursor);

      if(i == vectors.length - 1){ //Last vector
        output.destination = cursor; 
        //Destination will not be the same due to mathematical incorrectness
      }
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

  function getUnfoldedVectorStreet(street, unfold, closeGaps, straightenPathConnections){
    var output = JSON.parse( JSON.stringify(street) );

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


    output.vectors = newVectors;
    return output;
  }


  // Converts coordinates based street into vector based
  function getStreetWithVectors(street){
    // Copy street and remove unnecessary data
    var output = JSON.parse( JSON.stringify(street) );
        output.vectors = [];
        delete output.components;
        delete output.nodes;

    var components = street.components;
    var previousNode;
    var previousBearing;

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
    getObjectBearing : getObjectBearing,
    rotateVectorStreet : rotateVectorStreet,
    getDistanceInPixels : getDistanceInPixels,
    getStreetWithVectors : getStreetWithVectors,
    getUnfoldedVectorStreet : getUnfoldedVectorStreet,
    getStreetWithCoordinates : getStreetWithCoordinates,
    calculateAndSetObjectBearing : calculateAndSetObjectBearing
  }
})()