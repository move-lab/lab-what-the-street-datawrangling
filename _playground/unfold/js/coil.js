var coil = (function() {
  //Properties
  var coil = {
    curveRadius: 5,
    width: 600 - 10,
    padding: [200, 200]
  }

  function setProperties(width, curveRadius){
    coil.curveRadius = curveRadius;
    coil.width = width - curveRadius * 2;
  }

  function getOffsetFromCenterline(vectorStreet){
    var coordinates = [];
    var bearingCounter = 0;
    var distanceCounter = 0;
    var cursor = {x: 0, y: 0};
    var vectors = vectorStreet.vectors;
    coordinates.push({x: cursor.x, y: cursor.y, unit: "km", distance: 0})

    for (var i = 0; i < vectors.length; i++) {
      var vector = vectors[i];
      bearingCounter += vector.deltaBearing;
      distanceCounter += vector.distance;
      var dx = Math.sin(toRadians(bearingCounter)) * vector.distance;
      var dy = Math.cos(toRadians(bearingCounter)) * vector.distance;

      cursor.x += dx;
      cursor.y -= dy;

      coordinates.push({x: cursor.x, y: cursor.y, unit: "km", distance: distanceCounter})
    };
    return coordinates;
  }

  function getCoiledStreet(vectorStreetDivided, distanceOffsetInKm){
    var output = JSON.parse(JSON.stringify(vectorStreetDivided));
        delete output.vectors
        delete output.destination
        delete output.objectBearing

    var unfoldedStreet = getUnfoldedStreetSimple(vectorStreetDivided, 1, 5);
    unfold.calculateAndSetObjectBearing(unfoldedStreet);
    var delta = getAngleDifference(90, unfoldedStreet.objectBearing);

    unfold.rotateVectorStreet(unfoldedStreet, delta);
    var offsetFromCenterline = getOffsetFromCenterline(unfoldedStreet);
    var geometry = coilGeometry(offsetFromCenterline, distanceOffsetInKm);

    output.vectors = geometry.vectors;
    output.totalVariation = geometry.totalVariation;
    output.length = geometry.length;
    output.coilEnd = geometry.coilEnd;
    output.coilStart = geometry.coilStart;
    output.coilOrigin = geometry.coilOrigin;

    return output;
  }

  function coilGeometry(offsetFromCenterline, distanceOffset){
    updateProperties();

    var output = {
      vectors: []
    };
    var previousOffset;
    var previousCursor;
    var previousResult;
    var previousAngle;

    var lengthCounter = 0;
    var totalVariation = 0;

    output.coilStart = distanceOffset;

    for (var i = 0; i < offsetFromCenterline.length; i++) {
      var currentOffset = offsetFromCenterline[i];
      var currentDistance = currentOffset.distance + distanceOffset;

      //define scaling of bump height
      var bumpHeight;
      if (currentOffset.y < 0) {
        bumpHeight = -Math.pow(Math.abs(currentOffset.y), 1/3);
      }else{
        bumpHeight = Math.pow(currentOffset.y, 1/3);
      }

      bumpHeight = bumpHeight/500;

      // Get position on coil
      //console.log(currentDistance*1000);
      var cursor = getPositionOnCoil( currentDistance*1000 );

      var dx = Math.sin(cursor.angle) * bumpHeight;
      var dy = Math.cos(cursor.angle) * bumpHeight;
        
      var x = cursor.x + dx;
      var y = cursor.y + dy;

      var result = {
        x: x,
        y: y
      }
      

      if (i == 0) {
        //var newDistance = 0;
      }else{
        var angle = getAngle(previousResult, result);

        if (i > 1) {
          var deltaAngle = getAngleDifference(angle, previousAngle);
          totalVariation += Math.abs(deltaAngle);
        }else{
          var deltaAngle = angle;
        }

        var newDistance = Math.sqrt(Math.pow(result.x - previousResult.x,2) + Math.pow(result.y - previousResult.y,2))
        lengthCounter += newDistance;

        var outputPiece = {
          distance: newDistance,
          deltaAngle: deltaAngle
        };

        previousAngle = angle;
        output.coilEnd = currentDistance;
        output.vectors.push(outputPiece);
      }

      

      previousOffset = JSON.parse(JSON.stringify(currentOffset));
      previousCursor = JSON.parse(JSON.stringify(cursor));
      previousResult = JSON.parse(JSON.stringify(result));
    }

    output.coilOrigin = getPositionOnCoil( distanceOffset*1000 );
    output.length = lengthCounter;
    output.totalVariation = totalVariation;
    return output;
  }

  //Returns svg code of coil
  function getSvgCode(coordinateStreets, gapSize){
    updateProperties();

    margin = {
      top: 0,
      left: 0
    }

    margin.top += coil.padding[0]/2;
    margin.left += coil.padding[1]/2;

    var distanceCounter = 0;
    var arrayOfSvgPieces = [];
    var svgHeight;
    var svgWidth = coil.width + coil.curveRadius*2 + margin.left + coil.padding[1];
    var lastY;

  for (var i = 0; i < coordinateStreets.length; i++) {
      var street = coordinateStreets[i];
      var coordinates = street.coordinates;
      arrayOfSvgPieces.push('<path id="' + street._id + '" stroke="#50E3C2" stroke-width="4" fill="none" d="');
      for (var j = 0; j < coordinates.length; j++) {
        var point = coordinates[j];

        var distance = point.x;        
        //var bumpHeight = point.y;
        var bumpHeight = point.y;

        if (point.y < 0) {
          bumpHeight = -Math.pow(Math.abs(point.y), 1/3);
        }else{
          bumpHeight = Math.pow(point.y, 1/3);
        }
        //console.log(point.y, Math.log(point.y), Math.sqrt(point.y));

        var currentDistance = distanceCounter + distance;

        var cursor = getPositionOnCoil( currentDistance);

        var dx = Math.sin(cursor.angle) * bumpHeight;
        var dy = Math.cos(cursor.angle) * bumpHeight;
        
        var x = cursor.x + margin.left + dx;
        var y = Math.round((cursor.y + margin.top + dy)*10)/10;

        svgHeight = y;
        if (j==0) {
          arrayOfSvgPieces.push('M' + x + ',' + y + ' ');
        }else{
          if (lastY == y && j != 1) {
            arrayOfSvgPieces[arrayOfSvgPieces.length - 1] = ('L' + x + ',' + y + ' ');
          }else{
            arrayOfSvgPieces.push('L' + x + ',' + y + ' ');  
          }
          
        }
        if (j == coordinates.length -1) {
          distanceCounter += distance;
        };
        lastY = y;
      };
      arrayOfSvgPieces.push('"/>');
      distanceCounter += gapSize;
    };

    svgHeight += margin.top;
    svgHeight += coil.padding[0];

    arrayOfSvgPieces.push('" />');
    arrayOfSvgPieces.push('</svg>');

    arrayOfSvgPieces.unshift('<svg width="' + svgWidth + 'px" height="' + svgHeight +'px"  viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '">');

    var svgCode = arrayOfSvgPieces.join("");
    return svgCode;
  }


  function updateProperties(){
    var curveCircumference = (2 * coil.curveRadius * Math.PI);
    var curveLength = curveCircumference/2;
    coil.curveCircumference = curveCircumference;
    coil.curveLength = curveLength;
  }


  function getPositionOnCoil(distanceInMeter){
    var coilSegmentLength = 2 * coil.width + 2 * coil.curveLength; //width, curve down, width, curve down
    var segmentNumber = Math.floor(distanceInMeter / coilSegmentLength);
    var modulo = distanceInMeter % coilSegmentLength;
    var part;
    var partPosition;
    var pivot;

    if (modulo < coil.width * 1 + coil.curveLength * 0) {
      part = 0;
      partPosition = modulo;
      pivot = 0;
    }else if(modulo < coil.width * 1 + coil.curveLength * 1){
      part = 1;
      partPosition = modulo - coil.width;
      pivot = 1;
    }else if(modulo < coil.width * 2 + coil.curveLength * 1){
      part = 2;
      partPosition = modulo - coil.width - coil.curveLength;
      pivot = 1;
    }else if(modulo < coil.width * 2 + coil.curveLength * 2){
      part = 3;
      partPosition = modulo - coil.width * 2 - coil.curveLength;
      pivot = 2;
    }else{
      console.log('this should not happen', modulo);
    }

    var x;
    var y;
    var angle;
    var angleOutput;

    switch(part){
      case 0:
        x = partPosition + coil.curveRadius;
        y = pivot * coil.curveRadius * 2;
        angleOutput = toRadians(0);
        break;

      case 1:
        x = partPosition + coil.curveRadius;
        y = pivot * coil.curveRadius * 2;
        var completionPercentage = partPosition / coil.curveLength;
        angle = toRadians(180 - completionPercentage * 180);
        var dx = Math.sin(angle) * coil.curveRadius;
        var dy = Math.cos(angle) * coil.curveRadius;
        x = dx + coil.width + coil.curveRadius;
        y = pivot * coil.curveRadius + dy;
        angleOutput = toRadians(completionPercentage * 180);
        break;
      case 2:
        x = (coil.width - partPosition) + coil.curveRadius;
        y = pivot * coil.curveRadius * 2;
        angleOutput = toRadians(180);
        break;

      case 3:
        var completionPercentage = partPosition / coil.curveLength;
        angle = - toRadians(180 - completionPercentage * 180);
        var dx = Math.sin(angle) * coil.curveRadius;
        var dy = Math.cos(angle) * coil.curveRadius;
        x = dx + coil.curveRadius;
        y = pivot * coil.curveRadius + dy + coil.curveRadius;
        angleOutput = toRadians(completionPercentage * 180 - 180);
        break;
    }

    var segmentTop = segmentNumber * coil.curveRadius * 4;
    var output = {
      x: x/1000,
      y: (y + segmentTop)/1000,
      angle: angleOutput
    }

    return output;
  }

  // Convert degrees to radians
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function getDistanceInPixels(meter, meterPerPixel){
    return meter * 2 / meterPerPixel; //e.g. you have 2 meters distance, and one pixel equals 4 meters, than it returns 0.5 pixel
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

  function getAngle(p1, p2){
      var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI + 90;
      while(angleDeg < -180){
          angleDeg += 360;
      }
      while(angleDeg > 180){
          angleDeg -= 360;
      }
      return angleDeg
  }

  return {
    getOffsetFromCenterline : getOffsetFromCenterline,
    getPositionOnCoil : getPositionOnCoil,
    getCoiledStreet : getCoiledStreet,
    setProperties : setProperties,
    coilGeometry : coilGeometry,
    getSvgCode : getSvgCode
  }

})()