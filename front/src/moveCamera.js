"use strict";

var THREE = require('three');


module.exports = function(camera, cameraMovedCallback){
    
    return function moveObject(x, y, z) {
        if(typeof x === 'number')
            camera.position.x = x;
        
        if(typeof y === 'number')
            camera.position.y = y;
        
        if(typeof z === 'number')
            camera.position.z = z;
        
        camera.lookAt(new THREE.Vector3( camera.position.x, camera.position.y, 0 ));
        if(cameraMovedCallback)
            cameraMovedCallback(camera);
    };
    
}