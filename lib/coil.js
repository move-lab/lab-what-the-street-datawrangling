//170620

coil = (function() {
    //Properties
    var precisionPixels = 1;
    var precisionDistance = 7;
    var precisionAngle = 2;

    var coil = {
        curveRadius: 5,
        width: 600 - 10,
        padding: [20, 20]
    }

    function setProperties(width, curveRadius) {
        coil.curveRadius = curveRadius;
        coil.width = width - curveRadius * 2;
    }

    function setHeight(desiredHeight, streetLength, pixelPerMeter) {
        var maximumIterations = 20;
        for (var i = 0; i < maximumIterations; i++) {
            var coilHeight = getCoilHeight(coil.width, streetLength, pixelPerMeter);
            var difference = desiredHeight - coilHeight;
            if (difference < -10) {
                coil.curveRadius = coil.curveRadius * 0.9;
            } else if (difference > 10) {
                coil.curveRadius = coil.curveRadius * 1.1;
            } else {
                break;
            }
        }
    }

    function getPadding() {
        return coil.padding;
    }

    function getOffsetFromCenterline(vectorStreet) {
        var coordinates = [];
        var bearingCounter = 0;
        var distanceCounter = 0;
        var cursor = { x: 0, y: 0 };
        var vectors = vectorStreet.vectors;
        coordinates.push({ x: cursor.x, y: cursor.y, unit: "km", distance: 0 })

        for (var i = 0; i < vectors.length; i++) {
            var vector = vectors[i];
            bearingCounter += vector.deltaBearing;
            distanceCounter += vector.distance;
            var dx = Math.sin(toRadians(bearingCounter)) * vector.distance;
            var dy = Math.cos(toRadians(bearingCounter)) * vector.distance;

            cursor.x += dx;
            cursor.y -= dy;

            coordinates.push({ x: cursor.x, y: cursor.y, unit: "km", distance: distanceCounter })
        };
        return coordinates;
    }

    function getCoiledStreet(vectorStreetDivided, distanceOffsetInKm, bumpDamper, unfoldFactor) {
        var output = JSON.parse(JSON.stringify(vectorStreetDivided));
        delete output.vectors
        delete output.destination
        delete output.objectBearing
        delete output.bounds

        var unfoldedStreet = getUnfoldedStreetSimpleForCoiling(vectorStreetDivided, 1, unfoldFactor);
        unfold.calculateAndSetObjectBearing(unfoldedStreet);

        var delta = getAngleDifference(90, unfoldedStreet.objectBearing);

        unfold.rotateVectorStreet(unfoldedStreet, delta);
        var offsetFromCenterline = getOffsetFromCenterline(unfoldedStreet);
        var geometry = coilGeometry(offsetFromCenterline, distanceOffsetInKm, bumpDamper);
        output.vectors = geometry.vectors;
        output.totalVariation = geometry.totalVariation;
        output.length = geometry.length;
        output.coilEnd = geometry.coilEnd;
        output.coilStart = geometry.coilStart;
        output.coilOrigin = geometry.coilOrigin;

        // Simplify
        output.length = roundToDecimals(output.length, 3);
        output.coilStart = roundToDecimals(output.coilStart, 3);
        output.coilEnd = roundToDecimals(output.coilEnd, 3);
        output.totalVariation = roundToDecimals(output.totalVariation, 3);
        output.coilOrigin.x = roundToDecimals(output.coilOrigin.x, 4);
        output.coilOrigin.y = roundToDecimals(output.coilOrigin.y, 4);
        output.coilOrigin.angle = roundToDecimals(output.coilOrigin.angle, 4);
        for (var i = 0; i < output.originalLengths.length; i++) {
            output.originalLengths[i] = roundToDecimals(output.originalLengths[i], 3);
        };
        output.tags.area = roundToDecimals(output.tags.area, 4);
        output.tags.length = roundToDecimals(output.tags.length, 4);

        return output;
    }

    // Returns coordinates of unfolded street
    //
    //   progress: How far animation has 
    //      From:  0 (start - no change)
    //      To:    1 (end - fully unfolded and rotated that start- and endpoint are on the same y)
    //
    //   unfoldAmplitude: How far 
    //     From:   0 (no unravel)
    //     To:     Infinity (values until 30 work nicely)
    function getUnfoldedStreetSimpleForCoiling(vectorStreet, progress, unfoldAmplitude) {
        var unfoldFactor = 1 + progress * unfoldAmplitude;
        var output = unfold.getUnfoldedVectorStreet(vectorStreet, unfoldFactor, progress, progress);
        return output;
    }

    function getPropertiesToSquareCoil(streetLength) {
        var threshhold = 0.000001;
        var coilWidth = 0.0000;
        var coilHeight;

        var maxIterations = 5000;
        var iterations = 0;

        var direction = 1;
        var detail = 1;

        var difference

        do {
            coilHeight = getCoilHeight(coilWidth, streetLength)
                //console.log('w', coilWidth, 'h', coilHeight);
            coilWidth += 0.5 / (detail * 10) * direction
            if (coilWidth > coilHeight && direction == 1) {
                detail++;
                direction = -1;
            }
            if (coilWidth < coilHeight && direction == -1) {
                detail++;
                direction = 1;
            }
            if (iterations > maxIterations) {
                break;
            };
            iterations++
            difference = Math.abs(coilWidth - coilHeight)
        } while (difference > threshhold)

        return { width: coilWidth, height: coilHeight }
    }


    function getCoilHeight(coilWidth, streetLength, pixelPerMeterInput) {
        var pixelPerMeter = pixelPerMeterInput || 1;
        var innerCoilWidth = coilWidth - 2 * coil.curveRadius
        var slopeHeight = 2 * coil.curveRadius;
        var coilCurve = coil.curveRadius * Math.PI
        var numberOfCompleteWidths = Math.floor(streetLength / innerCoilWidth)

        var slope = coilCurve + innerCoilWidth;
        var numberOfSlopes = streetLength / slope;
        var numberOfCompleteSlopes = Math.floor(numberOfSlopes);
        var leftoverLength = streetLength - numberOfCompleteSlopes * slope
        if (leftoverLength > innerCoilWidth) {
            leftoverLength -= innerCoilWidth;
        }
        var resultingHeight = Math.ceil(numberOfSlopes) * slopeHeight * pixelPerMeter;
        //console.log('w', coilWidth ,'h', resultingHeight)
        return resultingHeight
    }

    function coilGeometry(offsetFromCenterline, distanceOffset, bumpDamper) {
        bumpDamper = bumpDamper || 170;
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
                bumpHeight = -Math.pow(Math.abs(currentOffset.y), 1 / 3);
            } else {
                bumpHeight = Math.pow(currentOffset.y, 1 / 3);
            }

            bumpHeight = bumpHeight / bumpDamper;
            bump = Math.min(coil.curveRadius - 2, bumpHeight);

            // Get position on coil
            //console.log(currentDistance*1000);
            var cursor = getPositionOnCoil(currentDistance * 1000);

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
            } else {
                var angle = getAngle(previousResult, result);

                if (i > 1) {
                    var deltaAngle = getAngleDifference(angle, previousAngle);
                    totalVariation += Math.abs(deltaAngle);
                } else {
                    var deltaAngle = angle;
                }

                var newDistance = Math.sqrt(Math.pow(result.x - previousResult.x, 2) + Math.pow(result.y - previousResult.y, 2))
                lengthCounter += newDistance;

                var outputPiece = {
                    distance: roundToDecimals(newDistance, precisionDistance),
                    deltaAngle: roundToDecimals(deltaAngle, precisionAngle)
                };

                previousAngle = angle;
                output.coilEnd = currentDistance;
                output.vectors.push(outputPiece);
            }

            previousOffset = JSON.parse(JSON.stringify(currentOffset));
            previousCursor = JSON.parse(JSON.stringify(cursor));
            previousResult = JSON.parse(JSON.stringify(result));
        }

        output.coilOrigin = getPositionOnCoil(distanceOffset * 1000);
        output.length = lengthCounter;
        output.totalVariation = totalVariation;
        return output;
    }

    function generateSvg(coiledStreets, meterPerPixel, svgWidth, stroke) {
        stroke = stroke || '#000000' // '#50E3C2';
        var svgPieces = generateSvgPieces(coiledStreets, meterPerPixel, svgWidth, stroke);
        var svgCode = svgPieces.join('');
        return svgCode;
    }

    var furthestY;

    function generateSvgPieces(coiledStreets, meterPerPixel, svgWidth, stroke, strokeWidth) {
        stroke = stroke || '#000000' // '#50E3C2';
        var svgPieces = [];
        var cumulativeArea = 0;
        for (var s = 0; s < coiledStreets.length; s++) {
            var obj = coiledStreets[s];
            var coiledStreet = {
                "_id": obj._id,
                "vectors": obj.coiled.vectors,
                "coilOrigin": obj.properties.coilOrigin,
                "tags": {
                    "area": Number(obj.properties.area),
                    "length": Number(obj.properties.length),
                    "name": obj.properties.name,
                    "neighborhood": obj.properties.neighborhood
                }
            }

            var streetName = coiledStreet.tags.name || null;
            var neighborhoodName = coiledStreet.tags.neighborhood || null;

            if (streetName) {
                streetName = streetName.replace('&', '&amp;');
            }
            if (neighborhoodName) {
                neighborhoodName = neighborhoodName.replace('&', '&amp;');
            }
            var area = coiledStreet.tags.area;
            cumulativeArea += area;
            var path = generatePath(coiledStreet, meterPerPixel, stroke, strokeWidth, streetName, neighborhoodName, cumulativeArea);
            svgPieces.push(path);
        }

        svgPieces.push('</svg>');
        var mainString = '<svg ';
        svgHeight = furthestY + 20;
        mainString += 'width="' + Math.round(svgWidth) + 'px" height="' + Math.round(svgHeight) + 'px"  ';
        mainString += 'viewport="0 0 ' + Math.round(svgWidth) + ' ' + Math.round(svgHeight) + '" ';
        mainString += 'version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
        svgPieces.unshift(mainString);
        svgPieces.unshift('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
        return svgPieces;
    }

    function generatePath(coiledStreet, meterPerPixel, stroke, strokeWidth, streetName, neighborhoodName, cumulativeArea) {
        furthestY = 0;
        stroke = stroke || '#000000' // '#50E3C2';
        strokeWidth = Math.round(strokeWidth*100)/100 || 10;
        var scale = meterPerPixel / 1000;
        // var cursor = {
        //     x: (coil.padding[1] / 2 + strokeWidth/2) + coiledStreet.coilOrigin.x / scale,
        //     y: (coil.padding[0] / 2 + strokeWidth/2) + coiledStreet.coilOrigin.y / scale
        // };

        var cursor = {
            x: (strokeWidth / 2) + coiledStreet.coilOrigin.x / scale,
            y: (strokeWidth / 2) + coiledStreet.coilOrigin.y / scale
        };

        var coiledGeometry = coiledStreet.vectors;

        var angleCounter = 0;
        var pathPieces = [];
        var lastUsedY;
        //var name = coiledStreet.tags.name.name || coiledStreet.tags.name || "unnamed";
        //name = name.replace(" ", "_");
        name = coiledStreet['_id']
        var pathString = "";
        pathString += '<path id="' + name + '" ';
        pathString += 'stroke-linecap="round" ';
        pathString += 'stroke="' + stroke + '" ';
        pathString += 'stroke-width="' + strokeWidth + '" ';
        pathString += 'fill="none" ';
        if (streetName) {
            pathString += 'moovel_name="' + streetName + '" ';
        }
        if (neighborhoodName) {
            pathString += 'moovel_neighborhood="' + neighborhoodName + '" ';
        }
        pathString += 'moovel_area="' + coiledStreet.tags.area.toFixed(2) + '" ';
        pathString += 'moovel_cumulative_area="' + cumulativeArea.toFixed(2) + '" ';
        pathString += 'moovel_length="' + coiledStreet.tags.length.toFixed(2) + '" ';
        pathString += 'd="';

        pathPieces.push(pathString);
        for (var j = 0; j < coiledGeometry.length; j++) {
            var vector = coiledGeometry[j];

            angleCounter += vector[1];

            var distance = vector[0] / scale;
            var dx = Math.sin(toRadians(angleCounter)) * distance;
            var dy = Math.cos(toRadians(angleCounter)) * distance;

            cursor.x += dx;
            cursor.y -= dy;



            var currentY = roundToHalf(cursor.y);
            if (currentY > furthestY) {
                furthestY = currentY;
            }

            if (j == 0) {
                pathPieces.push('M' + roundToHalf(cursor.x + 10, precisionPixels) + ',' + (currentY+3) + ' ');
                lastUsedY = currentY;
            } else if (lastUsedY !== currentY || j == coiledGeometry.length - 1) { // Only add a new point if there is change -> saves storage
                pathPieces.push('L' + roundToHalf(cursor.x + 10, precisionPixels) + ',' + (currentY+3) + ' ');
                lastUsedY = currentY;
            }
        }

        pathPieces.push('" />');

        var svgCode = pathPieces.join('');
        return svgCode;
    }


    function updateProperties() {
        var curveCircumference = (2 * coil.curveRadius * Math.PI);
        var curveLength = curveCircumference / 2;
        coil.curveCircumference = curveCircumference;
        coil.curveLength = curveLength;
    }


    function getPositionOnCoil(distanceInMeter) {
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
        } else if (modulo < coil.width * 1 + coil.curveLength * 1) {
            part = 1;
            partPosition = modulo - coil.width;
            pivot = 1;
        } else if (modulo < coil.width * 2 + coil.curveLength * 1) {
            part = 2;
            partPosition = modulo - coil.width - coil.curveLength;
            pivot = 1;
        } else if (modulo < coil.width * 2 + coil.curveLength * 2) {
            part = 3;
            partPosition = modulo - coil.width * 2 - coil.curveLength;
            pivot = 2;
        } else {
            console.log('this should not happen', modulo);
        }

        var x;
        var y;
        var angle;
        var angleOutput;

        switch (part) {
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
                angle = -toRadians(180 - completionPercentage * 180);
                var dx = Math.sin(angle) * coil.curveRadius;
                var dy = Math.cos(angle) * coil.curveRadius;
                x = dx + coil.curveRadius;
                y = pivot * coil.curveRadius + dy + coil.curveRadius;
                angleOutput = toRadians(completionPercentage * 180 - 180);
                break;
        }

        var segmentTop = segmentNumber * coil.curveRadius * 4;
        var output = {
            x: x / 1000,
            y: (y + segmentTop) / 1000,
            angle: angleOutput
        }

        return output;
    }

    // Convert degrees to radians
    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    function getDistanceInPixels(meter, meterPerPixel) {
        return meter * 2 / meterPerPixel; //e.g. you have 2 meters distance, and one pixel equals 4 meters, than it returns 0.5 pixel
    }

    // Returns the closest angular difference between two angles (between -180 and 180)
    function getAngleDifference(angle1, angle2) {
        var d = angle1 - angle2
        while (d < -180) {
            d += 360;
        };
        while (d > 180) {
            d -= 360;
        };
        return d;
    }

    // Helper script to round values
    function roundToDecimals(value, numberOfDecimals) {
        var divide = Math.pow(10, numberOfDecimals);
        var roundedValue = Math.round(value * divide) / divide;
        return roundedValue;
    }

    function roundToHalf(value) {
        var converted = parseFloat(value); // Make sure we have a number 
        var decimal = (converted - parseInt(converted, 10));
        decimal = Math.round(decimal * 10);
        if (decimal == 5) {
            return (parseInt(converted, 10) + 0.5);
        }
        if ((decimal < 3) || (decimal > 7)) {
            return Math.round(converted);
        } else {
            return (parseInt(converted, 10) + 0.5);
        }
    }

    function getAngle(p1, p2) {
        var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI + 90;
        while (angleDeg < -180) {
            angleDeg += 360;
        }
        while (angleDeg > 180) {
            angleDeg -= 360;
        }
        return angleDeg
    }

    return {
        getPropertiesToSquareCoil: getPropertiesToSquareCoil,
        getOffsetFromCenterline: getOffsetFromCenterline,
        generateSvgPieces: generateSvgPieces,
        getPositionOnCoil: getPositionOnCoil,
        getCoiledStreet: getCoiledStreet,
        setProperties: setProperties,
        setHeight: setHeight,
        coilGeometry: coilGeometry,
        generateSvg: generateSvg,
        getPadding: getPadding
    }
})()