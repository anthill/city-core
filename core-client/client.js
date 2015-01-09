"use strict";

// watchify core-client/client.js -o core-client/app.js -d -v
// node server.js dev core-client

var THREE = require('three');
var bordeaux3dCore = require('../index.js');

var bordeaux3D = bordeaux3dCore(document.querySelector('#view'));

// Get buttons
var lightButton = document.querySelector('#light');
var meshButton = document.querySelector('#mesh');
var controlsButton = document.querySelector('#controls');

// Add event listeners
lightButton.addEventListener('click', function(){
	var greenLight = new THREE.AmbientLight("#004400"); 
	bordeaux3D.addLight(greenLight);
});

meshButton.addEventListener('click', function(){
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshLambertMaterial({
        color: 0xAA0000,
        wireframe: false,
        shading: THREE.FlatShading
    });
    var cube = new THREE.Mesh(geometry, material);
    var pos = {
        x: bordeaux3D.camera.position.x + 3*bordeaux3D.camera.direction.x,
        y: bordeaux3D.camera.position.y + 3*bordeaux3D.camera.direction.y,
        z: bordeaux3D.camera.position.z + 3*bordeaux3D.camera.direction.z
    };
    cube.position.set(pos.x, pos.y, pos.z);
	bordeaux3D.addMesh(cube);
});

controlsButton.addEventListener('click', function(){
    // TODO
});
