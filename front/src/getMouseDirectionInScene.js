'use strict';

var THREE = require('three');

module.exports = function(camera, domElement){
    var elementRect = domElement.getBoundingClientRect();
    var projector = new THREE.Projector();
    
    /*
        event is a MouseEvent
    */
    return function(event){
        var normalizedMouseX = (event.clientX / elementRect.width) * 2 - 1;
        var normalizedMouseY = - (event.clientY / elementRect.height) * 2 + 1;

        // Create Vector3 from mouse position, with Z = 0
        var mousePos = new THREE.Vector3(normalizedMouseX, normalizedMouseY, 0);

        // Create a picking-specific RayCaster from Three.js library 
        var ray = projector.pickingRay(mousePos, camera);

        return ray.direction;
    }

};