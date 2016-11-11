// Of the given geometry, group together every X points
function grouppoints(points, numpoints) {

  points.forEach(function(point, i){

    point[2] = i;
    point.id = i;
    point.prev = points[i - 1];
    point.next = points[i + 1];

  });

  return points.filter(function(p){
    return p.id % numpoints == 0;
  });

}

