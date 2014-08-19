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
var renderer = _3dviz.renderer;

var controls = require('./controls.js')(camera);
var moveCamera = require('./moveCamera.js')(camera, function(camera){
    // visible bounding box
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

var MAX_Y = require('./MAX_Y');


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

function invLinX(x) {
    return (x + 0.575803)*(123*200-125*200)/(-0.575803+0.570726) + 123*200;
}
function invLinY(y) {
    return (y - 44.839642)*((MAX_Y - 112)*200 - (MAX_Y - 113)*200)/(44.841441 - 44.839642) + (MAX_Y - 113)*200;
}

serverCommunication.metadataP.then(function(metadata) {

    Object.keys(metadata).forEach(function(id) {
        var building = metadata[id];
        var X = building.X;
        var Y = building.Y;
        var item = [building.xmin + X*200, building.ymin + (MAX_Y-Y)*200, building.xmax + X*200, building.ymax+ (MAX_Y-Y)*200, {id: id, X:X, Y:Y}];
        rTree.insert(item);
    });

    geoCode("peyberland bordeaux").then(function(coords) {
        console.log("moving to", invLinX(coords.lon), invLinY(coords.lat), 300);
        moveCamera(invLinX(coords.lon), invLinY(coords.lat), 300);
    })
});

gui.addressControler.onFinishChange(function(value) {
    geoCode(value).then(function(coords) {
        console.log("moving to", invLinX(coords.lon), invLinY(coords.lat), camz)
        moveCamera(invLinX(coords.lon), invLinY(coords.lat), camz);
    })
});

gui.altitudeControler.onFinishChange(function(value) {
    var camz = guiControls.altitude;
    moveCamera(undefined, undefined, camz);
});




