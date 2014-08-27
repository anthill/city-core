'use strict';

var THREE = require('three');

var CameraProxy = require('./CameraProxy');

// global variables for time
var curHour = 10;
var seasonsMonth = [7, 11];
var curMonth = seasonsMonth[0];

// Create the scene and set the scene size.
var scene = new THREE.Scene();

var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;


// Create a renderer and add it to the DOM.
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(WIDTH, HEIGHT);
renderer.shadowMapEnabled = true;
renderer.shadowMapSoft = true;

document.body.appendChild(renderer.domElement);

// Set the background color of the scene.
renderer.setClearColorHex(0x333F47, 1);

// Create a camera, zoom it out from the model a bit, and add it to the scene.
var camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 5000 );
scene.add(camera);

var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
hemiLight.color.setHSL( 0.6, 1, 0.6 );
hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
hemiLight.position.set( 0, 500, 0 );
scene.add( hemiLight );

var sunlight = new THREE.DirectionalLight(0xffffff, 1);
sunlight.lookAt([10000,24100,0]);
sunlight.castShadow = true;
sunlight.shadowDarkness = 0.6;
sunlight.shadowMapWidth = 2048;
sunlight.shadowMapHeight = 2048;
sunlight.position.set(0,0,400);
scene.add(sunlight);



// Renders the scene and updates the render as needed.
(function animate() {

    // Read more about requestAnimationFrame at http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    requestAnimationFrame(animate);

    // Render the scene.
    renderer.render(scene, camera);

})();

module.exports = {
    scene: scene,
    camera: CameraProxy(camera),
    light: sunlight,
    renderer: renderer
};