var wurstify = (function() {
  var snake = {
    curveRadius: 5,
    width: 600 - 10,
    padding: [0, 0]
  }

  function setProperties(width, curveRadius, padding){
    snake.curveRadius = curveRadius;
    snake.width = width - curveRadius * 2;
    snake.padding = padding;
  }

  function getSvgCode(bendInformation){
    updateProperties();

    margin = {
      top : 0,
      left : 0
    }

    margin.top += snake.padding[0]/2;
    margin.left += snake.padding[1]/2;

    var distanceCounter = 0;
    var mPerPixel = 2;
    var gap = 2 * mPerPixel;
    var arrayOfSvgPieces = [];
    var svgHeight;
    var svgWidth = snake.width + snake.curveRadius*2 + margin.left + snake.padding[1];

    for (var i = 0; i < bendInformation.length; i++) {
      var street = bendInformation[i];
      arrayOfSvgPieces.push('<path stroke="#4990E2" stroke-width="1" fill="none" d="');
      for (var j = 0; j < street.length; j++) {
        var point = street[j]
        distanceCounter += point.distance * mPerPixel;

        var cursor = getPositionOnWurst( distanceCounter );
        var bumpHeight = - point.y * 20;
        var dx = Math.sin(cursor.angle) * bumpHeight;
        var dy = Math.cos(cursor.angle) * bumpHeight;
        
        var x = cursor.x + margin.left - dx;
        var y = cursor.y + margin.top - dy;
        svgHeight = y;
        if (j==0) {
          arrayOfSvgPieces.push('M' + x + ',' + y);
        }else{
          arrayOfSvgPieces.push('L' + x + ',' + y + ' ');
        }
      };
      arrayOfSvgPieces.push('"/>');
      distanceCounter += gap;
    };

    svgHeight += margin.top;
    svgHeight += snake.padding[0];

    arrayOfSvgPieces.push('" />');
    arrayOfSvgPieces.push('</svg>');

    arrayOfSvgPieces.unshift('<svg width="' + svgWidth + 'px" height="' + svgHeight +'px"  viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '">');

    var svgCode = arrayOfSvgPieces.join("");
    return svgCode;
  }

  function updateProperties(){
    var curveCircumference = (2 * snake.curveRadius * Math.PI);
    var curveLength = curveCircumference/2;
    snake.curveCircumference = curveCircumference;
    snake.curveLength = curveLength;
  }

  function getPositionOnWurst(position){
    var snakeSegmentLength = 2 * snake.width + 2 * snake.curveLength; //width, curve down, width, curve down
    var segmentNumber = Math.floor(position / snakeSegmentLength);
    var modulo = position % snakeSegmentLength;
    var part;
    var partPosition;
    var pivot;
    if (modulo < snake.width * 1 + snake.curveLength * 0) {
      part = 0;
      partPosition = modulo;
      pivot = 0;
    }else if(modulo < snake.width * 1 + snake.curveLength * 1){
      part = 1;
      partPosition = modulo - snake.width;
      pivot = 1;
    }else if(modulo < snake.width * 2 + snake.curveLength * 1){
      part = 2;
      partPosition = modulo - snake.width - snake.curveLength;
      pivot = 1;
    }else if(modulo < snake.width * 2 + snake.curveLength * 2){
      part = 3;
      partPosition = modulo - snake.width * 2 - snake.curveLength;
      pivot = 2;
    }else{
      console.log('this should not happen');
    }

    var x;
    var y;
    var angle;
    var angleOutput;

    switch(part){
      case 0:
        x = partPosition + snake.curveRadius;
        y = pivot * snake.curveRadius * 2;
        angleOutput = toRadians(0);
        break;

      case 1:
        x = partPosition + snake.curveRadius;
        y = pivot * snake.curveRadius * 2;
        var completionPercentage = partPosition / snake.curveLength;
        angle = toRadians(180 - completionPercentage * 180);
        var dx = Math.sin(angle) * snake.curveRadius;
        var dy = Math.cos(angle) * snake.curveRadius;
        x = dx + snake.width + snake.curveRadius;
        y = pivot * snake.curveRadius + dy;
        angleOutput = toRadians(completionPercentage * 180);
        break;
      case 2:
        x = (snake.width - partPosition) + snake.curveRadius;
        y = pivot * snake.curveRadius * 2;
        angleOutput = toRadians(180);
        break;

      case 3:
        var completionPercentage = partPosition / snake.curveLength;
        angle = - toRadians(180 - completionPercentage * 180);
        var dx = Math.sin(angle) * snake.curveRadius;
        var dy = Math.cos(angle) * snake.curveRadius;
        x = dx + snake.curveRadius;
        y = pivot * snake.curveRadius + dy + snake.curveRadius;
        angleOutput = toRadians(completionPercentage * 180 - 180);
        break;
    }

    var segmentTop = segmentNumber * snake.curveRadius * 4;
    var output = {
      x: x,
      y: y + segmentTop,
      angle: angleOutput
    }

    return output;
  }

  // Convert degrees to radians
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  };

  return {
    getPositionOnWurst : getPositionOnWurst,
    setProperties : setProperties,
    getSvgCode : getSvgCode
  }

})()