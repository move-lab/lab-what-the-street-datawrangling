var require  = patchRequire(require);
var fs       = require('fs');
var casper   = require('casper').create({
	waitTimeout: 20000,
	viewportSize: {
		width: 900,
		height: 900
	}
});

var url = 'http://localhost:8000/'
var exportFolderLocation = fs.workingDirectory + '/export';
var canvas = '#viewWrapper';

var nextButtonSelector = '#nextFrame';

createFolder(exportFolderLocation);

casper.start(url)
casper.waitUntilVisible('#interface')
casper.wait(6000) //because mapbox does not have a map view loaded callback ...
casper.then(function() {
    var wayName = this.getHTML('#wayName');
    saveAnimation(this, wayName)
})

casper.run();

function getStreetName(){
	casper.html('#interface .streetName')
	.then(function(result){
		return result
	})
}

function saveAnimation(that, streetName){
	console.log('Save street');
	
	var streetFolder = exportFolderLocation + '/' + streetName;
	createFolder( streetFolder );

	var counter = 0;
	for (var i = 0; i < 250; i++) {
		var file = streetFolder + "/" + streetName + "_" + counter + ".png";
		console.log('   Saving ' + file);
		that.captureSelector(file, canvas)
		that.mouse.click(nextButtonSelector)
		counter ++;
	};
}

function createFolder (dir) {
	console.log('Create folder: ' + dir)
	fs.makeDirectory(dir);
}