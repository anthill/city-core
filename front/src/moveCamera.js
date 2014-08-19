"use strict";

var THREE = require('three');


module.exports = function(camera, cameraMovedCallback){
    
    return function moveCamera(ncamx, ncamy, ncamz) {
        if(typeof ncamx === 'number')
            camera.position.x = ncamx;
        
        if(typeof ncamy === 'number')
            camera.position.y = ncamy;
        
        if(typeof ncamz === 'number')
            camera.position.z = ncamz;
        
        camera.lookAt(new THREE.Vector3( camera.position.x, camera.position.y, 0 ));
        if(cameraMovedCallback)
            cameraMovedCallback(camera);
    };
    
}