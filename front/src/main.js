'use strict';

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

var controls = require('./controls.js')(camera);
var moveCamera = require('./moveCamera.js')(camera, function(camera){// visible bounding box
    var L = 2 * camera.position.z * Math.tan(3.14*camera.fov/(2*180));
    var l = L * WIDTH / HEIGHT;
    // console.log(camera.position.x,camera.position.z);
    // console.log(L, l);
    // console.log("----------");
    var south = camera.position.y - L/2;
    var north = camera.position.y + L/2;
    var west = camera.position.x - l/2;
    var east = camera.position.x + l/2;
    loadTiles(south, north, east, west);
});

var MAX_Y = require('./MAX_Y.js');

var GeoConverter = require('./geoConverter.js');
var SunCalc = require('suncalc');

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


serverCommunication.metadataP.then(function(metadata) {

    Object.keys(metadata).forEach(function(id) {
        var building = metadata[id];
        var X = building.X;
        var Y = building.Y;
        var item = [building.xmin + X*200, building.ymin + (MAX_Y-Y)*200, building.xmax + X*200, building.ymax+ (MAX_Y-Y)*200, {id: id, X:X, Y:Y}];
        rTree.insert(item);
    });

    geoCode(guiControls.address).then(function(coords) {
        var newPosition = geoConverter.toLambert(coords.lon, coords.lat);
        moveCamera(newPosition.X, newPosition.Y, 300); })
});

gui.addressControler.onFinishChange(function(value) {
    geoCode(value).then(function(coords) {
        var newPosition = geoConverter.toLambert(coords.lon, coords.lat);
        moveCamera(newPosition.X, newPosition.Y, 300);
    })
});

gui.altitudeControler.onFinishChange(function(value) {
    var camz = guiControls.altitude;
    moveCamera(undefined, undefined, camz);
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


