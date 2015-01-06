"use strict";

// watchify core-client/client.js -o core-client/app.js -d -v
// node server.js dev core-client

var THREE = require('three');
var bordeaux3dCore = require('../index.js');

var bordeaux = bordeaux3dCore(document.querySelector('#view'));

// Get buttons
var lightButton = document.querySelector('#light');
var meshButton = document.querySelector('#mesh');
var controlsButton = document.querySelector('#controls');

// Add event listeners
lightButton.addEventListener('click', function(){
	var greenLight = new THREE.AmbientLight("#004400"); 
	bordeaux.addLight(greenLight);
});

meshButton.addEventListener('click', function(){
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshLambertMaterial({
        color: 0xAA0000,
        wireframe: false,
        shading: THREE.FlatShading
    });
    var cube = new THREE.Mesh(geometry, material);
	bordeaux.addMesh(cube);
});

controlsButton.addEventListener('click', function(){
    // TODO
});
