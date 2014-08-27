'use strict';

var THREE = require('three');

/*
    For visualization use
*/
module.exports = function(scene){
    
    /*
        v is any vector, like a Camera
    */
    return function(v){
        var ray = new THREE.Raycaster( v, new THREE.Vector3(0, 0, -1) );

        var intersected = ray.intersectObjects(scene.children, false);
        
        if(intersected.length === 0){
            ray = new THREE.Raycaster( v, new THREE.Vector3(0, 0, 1) );
            intersected = ray.intersectObjects(scene.children, false);
            
            return intersected.length === 0 ? undefined : - intersected[0].distance;
        }
        else{
            return intersected[0].distance;
        }
        
    };

}; 