'use strict';

var THREE = require('three');

var meshFromId = require('./meshFromId.js');
var infosFromMesh = require('./infosFromMesh.js');
var CameraProxy = require('./CameraProxy');

function poisonnedToString(){
    throw 'Do not use toString';
}

var SKY_ID = Object.freeze({toString: poisonnedToString});
var HELL_ID = Object.freeze({toString: poisonnedToString});

module.exports = function(container, skyImageURL){
    container = container || document.body;
    
    var containerBoundingRect = container.getBoundingClientRect();
    var WIDTH = containerBoundingRect.width,
        HEIGHT = containerBoundingRect.height;
    
    if(WIDTH < 20 || HEIGHT < 20){
        console.warn('Very small container', containerBoundingRect);
    }

    
    // Create the scene and set the scene size.
    var scene = new THREE.Scene();
    
    // skysphere
    var geometry = new THREE.SphereGeometry(100000, 60, 40);
    
    var imgUtils = THREE.ImageUtils;
    imgUtils.crossOrigin = 'anonymous';
    
    var uniforms = {
      texture: { type: 't', value: imgUtils.loadTexture(skyImageURL) }
    };

    var skymaterial = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   document.getElementById('sky-vertex').textContent,
      fragmentShader: document.getElementById('sky-fragment').textContent
    });

    var skyBox = new THREE.Mesh(geometry, skymaterial);
    skyBox.scale.set(-1, 1, 1);
    skyBox.eulerOrder = 'XZY';
    skyBox.renderDepth = 1000.0;
    scene.add(skyBox);



    infosFromMesh.set(skyBox, {
        id: SKY_ID,
        metadata: undefined,
        type: 'sky',
    });
    meshFromId.set(SKY_ID, skyBox);

    // add a box so we don't see the little gaps in the floor
    var planeGeom = new THREE.PlaneGeometry( 500000, 500000 );
    var material = new THREE.MeshLambertMaterial({
        color: 0xaaaaaa,
        wireframe: false,
        shading: THREE.FlatShading
    });
    var plane = new THREE.Mesh( planeGeom, material );
    plane.position.set(0, 0, -100);
    scene.add( plane );

    infosFromMesh.set(plane, {
        id: HELL_ID,
        metadata: undefined,
        type: 'hell',
    });
    meshFromId.set(HELL_ID, plane);

    // Create a camera, zoom it out from the model a bit, and add it to the scene.
    var camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 500000 );
    scene.add(camera);


    var sunlight = new THREE.DirectionalLight(0xffffff, 1);

    sunlight.castShadow = true;
    sunlight.shadowDarkness = 0.6;
    sunlight.shadowMapWidth = 4096;
    sunlight.shadowMapHeight = 4096;
    sunlight.shadowCameraNear = 1;
    sunlight.shadowCameraFar = 4000;

    sunlight.shadowCameraRight     =  200;
    sunlight.shadowCameraLeft     = -200;
    sunlight.shadowCameraTop      =  200;
    sunlight.shadowCameraBottom   = -200;
    // sunlight.shadowCameraVisible = true;

    scene.add(sunlight);

    var ambientLight = new THREE.AmbientLight( "#333329" ); 
    scene.add( ambientLight );

    // Create a renderer and add it to the DOM.
    var renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapWidth = 4096;
    renderer.shadowMapHeight = 4096;

    // Set the background color of the scene.
    renderer.setClearColorHex(0x333F47, 1);
    
    
    container.appendChild(renderer.domElement);
    
    
    var frame;

    function render(){
      if(!frame){
          frame = requestAnimationFrame(function() {
              renderer.render(scene, camera);
              frame = undefined;
          });
      }
    }

    render();
    
    // Note to future selves: we should output an API that enables sky modifications
    return {
        scene: scene,
        camera: CameraProxy(camera),
        lights: {
          sun: sunlight,
          ambient: ambientLight
        },
        domElement: renderer.domElement,    
        renderer: renderer,
        render: render
    }
};