// Rough Visvalingam simplification
// Better: https://bost.ocks.org/mike/simplify/
function simplify(points, threshold) {

  var heap = binaryHeap(function(a, b){
        return a.area < b.area;
      }),
      last = 0,
      check;

  points.forEach(function(point, i){

    point[2] = i;
    point.prev = points[i - 1];
    point.next = points[i + 1];
    point.area = getArea(point.prev, point, point.next);

    heap.insert(point);

  });

  while (check = heap.pop()) {

    check.area = last = Math.max(check.area, last);

    if (check.prev) {
      check.prev.next = check.next;
      recalc(check.prev);
    }

    if (check.next) {
      check.next.prev = check.prev;
      recalc(check.next);
    }

  }

  return points.filter(function(p){
    return p.area > threshold;
  });

  function recalc(point) {
    point.area = getArea(point.prev, point, point.next);
    heap.update(point);
  }

  function getArea(a,b,c) {

    if (!a || !c) {
      return Infinity;
    }

    return Math.abs(a[0] * b[1] - a[0] * c[1] + b[0] * c[1] - b[0] * a[1] + c[0] * a[1] - c[0] * b[1]) / 2;

  }

}

function binaryHeap(comparator) {

  var heap = {},
      nodes = [];

  heap.remove = function(val) {

    var len = nodes.length,
        end;

    for (var i = 0; i < len; i++) {

      if (nodes[i] === val) {

        end = nodes.pop();

        if (i < len - 1) {
          nodes[i] = end;
          this.sink(i);
        }

        break;

      }

    }

    return this;

  };

  heap.pop = function() {

    var top = nodes.shift();

    if (nodes.length) {
      nodes.unshift(nodes.pop());
      this.sink(0);
    }

    return top;

  };

  heap.bubble = function(i) {

    var pi = Math.floor((i + 1) / 2) - 1;

    if (i > 0 && this.compare(i, pi)) {
      this.swap(i, pi);
      this.bubble(pi);
    }

    return this;

  };

  heap.sink = function(i) {

    var len = nodes.length,
        ci = 2 * i + 1;

    if (ci < len - 1 && this.compare(ci + 1, ci)) {
      ci++;
    }

    if (ci < len && this.compare(ci, i)) {

      this.swap(i, ci);
      this.sink(ci);

    }

    return this;

  };

  heap.compare = function(i, j) {
    return comparator(nodes[i], nodes[j]);
  };

  heap.insert = function(d) {
    this.bubble(nodes.push(d) - 1);
  };

  heap.size = function() {
    return nodes.length;
  }

  heap.swap = function(i, j) {
    var swap = nodes[i];
    nodes[i] = nodes[j];
    nodes[j] = swap;
  };

  heap.update = function(d) {
    this.remove(d);
    this.insert(d);
    // bubble / sink instead?
  }

  heap.nodes = nodes;

  return heap;

}