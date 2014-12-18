"use strict";

/*
    Client-side API
    
    Start 
*/

module.exports = function(container, options){
    
    // Need a way to expose building to modify them (paint)
    // Interaction with geoloc
    
    return {
        addLight: function(light/*: THREE.Light*/){
            throw 'TODO';
        },
        changeControls: function(controls){
            throw 'TODO';
        },
        addMesh: function(mesh){
            // add tramway
            throw 'TODO';
        }
    };
}