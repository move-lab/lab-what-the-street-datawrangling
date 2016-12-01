run();

function run(){
	var entireSvg = generateSvg3();
	console.log('----------------------------');
	console.log('');
	console.log(entireSvg);
	console.log('');
	console.log('----------------------------');
	console.log('');
	console.log('SVG code copied to your clipboard');
	copyToMacClipboard(entireSvg)
}

function generateSvg(){
	var entireSvg = '<svg width="800" height="600" viewBox="0 0 800 600">';
	for(var i=0; i<1000; i++){
		var values = generateValues();
		var colWidth = 107;
		var colHeight = 352; 
		var colGap = 11;
		var x1 = 0;
		var x2 = colWidth;
		var x3 = colWidth+colGap;
		var x4 = colWidth*2+colGap;
		var x5 = colWidth*2+colGap*2;
		var x6 = colWidth*3+colGap*2;

		var y1 = Math.round(values[2]/100 * colHeight);
		var y2 = Math.round(values[1]/100 * colHeight);
		var y3 = Math.round(values[0]/100 * colHeight);
		var svg = '<path fill="none" stroke="#000" stroke-width="1" d="'
			svg += 'M' + x1 + ',' + y1 + ' ';
			svg += 'L' + x2 + ',' + y1 + ' ';
			svg += 'L' + x3 + ',' + y2 + ' ';
			svg += 'L' + x4 + ',' + y2 + ' ';
			svg += 'L' + x5 + ',' + y3 + ' ';
			svg += 'L' + x6 + ',' + y3;
			svg += '"/>';

		//console.log(i + ': 🚗' + values[0] + ' 🚃' + values[1] + ' 🚴' + values[2])
		//console.log(svg);
		entireSvg += svg;
	}
	entireSvg += '</svg>';
	return entireSvg;
}

function generateSvg2(){
	var entireSvg = '<svg width="800" height="600">';
	for(var i=0; i<100; i++){
		var values = generateValues();
		var colWidth = 107;
		var colHeight = 352; 
		var colGap = 11;
		var x1 = colWidth/2;
		var x2 = colWidth + colGap + colWidth/2;
		var x3 = colWidth*2 + colGap + colWidth/2;
		var x4 = colWidth*2 + colGap + colWidth;

		var y1 = Math.round(values[2]/100 * colHeight);
		var y2 = Math.round(values[1]/100 * colHeight);
		var y3 = Math.round(values[0]/100 * colHeight);
		var svg = '<path fill="none" stroke="#000" stroke-width="1" d="'
			svg += 'M' + 0 + ',' + y1 + ' ';
			svg += 'L' + x1 + ',' + y1 + ' ';
			svg += 'L' + x2 + ',' + y2 + ' ';
			svg += 'L' + x3 + ',' + y3 + ' ';
			svg += 'L' + x4 + ',' + y3;
			svg += '"/>';

		//console.log(i + ': 🚗' + values[0] + ' 🚃' + values[1] + ' 🚴' + values[2])
		//console.log(svg);
		entireSvg += svg;
	}
	entireSvg += '</svg>';
	return entireSvg;
}

function generateSvg3(){
	var entireSvg = '<svg width="800" height="600">';
	for(var i=0; i<100; i++){
		var values = generateValues();
		var colWidth = 107;
		var colHeight = 352; 
		var colGap = 11;
		var x0 = 0;
		var x1 = colWidth;
		var x2 = colWidth + colGap;
		var x3 = colWidth*2 + colGap;
		var x4 = colWidth*2 + colGap*2;
		var x5 = colWidth*3 + colGap*2;

		var y1 = Math.round(values[2]/100 * colHeight);
		var y2 = Math.round(values[1]/100 * colHeight);
		var y3 = Math.round(values[0]/100 * colHeight);
		var svg = '<path fill="none" stroke="#000" stroke-width="1" d="'
			svg += 'M' + x0 + ',' + y1 + ' ';
			svg += 'L' + x1 + ',' + y1;
			svg += '"/>';
		entireSvg += svg;

		var svg = '<path fill="none" stroke="#000" stroke-width="1" d="'
			svg += 'M' + x2 + ',' + y2 + ' ';
			svg += 'L' + x3 + ',' + y2;
			svg += '"/>';
		entireSvg += svg;

		var svg = '<path fill="none" stroke="#000" stroke-width="1" d="'
			svg += 'M' + x4 + ',' + y3 + ' ';
			svg += 'L' + x5 + ',' + y3;
			svg += '"/>';
		entireSvg += svg;
	}
	entireSvg += '</svg>';
	return entireSvg;
}

function generateValues(){
	var range = 80;
	var center = 20;
	var a = 50 + Math.round(gaussianRand()*range - range/2)
	var leftover = 100 - a;
	var b = Math.round(gaussianRand()*leftover)
	var c = 100 - (a + b);
	return [a,b,c]
}

function gaussianRand() {
  var rand = 0;

  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }

  return rand / 6;
}

function copyToMacClipboard(data) { var proc = require('child_process').spawn('pbcopy'); proc.stdin.write(data); proc.stdin.end(); }
