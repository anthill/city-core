'use strict';

var SunCalc = require('suncalc');
var THREE = require('three');

var serverCommunication = require('./serverCommunication.js');
var gui = require('./gui.js');
var guiControls = gui.guiControls;

//var parseGeometry = require('./parseGeometry.js');
var rTree = require('./rTree.js');
var geoCode = require('./geoCode.js');
var loadTiles = require('./loadTiles.js');

var _3dviz = require('./3dviz.js');
var scene = _3dviz.scene;
var camera = _3dviz.camera;
var light = _3dviz.light;
var renderer = _3dviz.renderer;


var raycasting = require('./raycasting.js')(camera, scene);

var INITIAL_ALTITUDE = 200;

var cityControls = require('./CityControls.js')(camera, renderer.domElement);
cityControls.switchToSkyView(24541.22, 11167.65, INITIAL_ALTITUDE);


var MAX_Y = require('./MAX_Y.js');

var GeoConverter = require('./geoConverter.js');


// TODO change values on resize
var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

// Create an event listener that resizes the renderer with the browser window.
window.addEventListener('resize', function() {
    WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
});

// initialise the geoconverter that will pass from a shifted lambert cc 45 to lon, lat and reverse
// the map is shifted
// -0.583232, 44.839270 corresponds to 1416800.1046884255, 4188402.562212417 in lambert 45
// and to (X=119) * 200 + (x=100), (MAX_Y-(Y=115))*200 + (y=100) in the map
var deltaX = 1416800.1046884255 - 119*200 - 100;
var deltaY = 4188402.562212417 - (MAX_Y-115)*200 - 100;
var geoConverter = new GeoConverter(45, deltaX, deltaY);

function moveTo(place){
    geoCode(place).then(function(coords) {
        var newPosition = geoConverter.toLambert(coords.lon, coords.lat);
        camera.position = new THREE.Vector3(newPosition.X, newPosition.Y, 300);
        camera.lookAt( new THREE.Vector3(newPosition.X, newPosition.Y, 0) );
    });
}


serverCommunication.metadataP.then(function(metadata) {

    Object.keys(metadata).forEach(function(id) {
        var building = metadata[id];
        var X = building.X;
        var Y = building.Y;
        var item = [building.xmin + X*200, building.ymin + (MAX_Y-Y)*200, building.xmax + X*200, building.ymax+ (MAX_Y-Y)*200, {id: id, X:X, Y:Y}];
        rTree.insert(item);
    });

    moveTo("peyberland bordeaux")
    
});

gui.addressControler.onFinishChange(function(value) {
    moveTo(value);
});

gui.altitudeControler.onFinishChange(function(value) {
    camera.position.z = guiControls.altitude; // value?
});


gui.hourControler.onChange(function(value) {
    // get today's sunlight times for Bordeaux
    var date = new Date();
    date.setHours(value);

    var sunPos = SunCalc.getPosition(date, -0.573781, 44.840484);

    var radius = 30000;
    var lightX = radius * Math.cos(sunPos.azimuth);
    var lightY = radius * Math.sin(sunPos.azimuth);
    var lightZ = radius * Math.tan(sunPos.altitude);
    light.position.set(lightX, lightY, lightZ);
});


camera.on('cameraviewchange', function(){
    console.log('camera', camera.position.x, camera.position.y, camera.position.z, camera.lookAtVector, camera.up);
});
