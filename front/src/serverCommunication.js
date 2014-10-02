'use strict';

var io = require('socket.io-client');
var buildingMap = require('./buildingMap.js');
var createBuildingMesh = require('./createBuildingMesh.js');
var scene = require('./3dviz').scene;

var meshToBuilding = require('./meshToBuilding');

//socket
var socket = io();
var metadataP = new Promise(function(resolve){
    socket.on('metadata', function(msg){
        var transportedMetadata = JSON.parse(msg.metadata);
        console.log("received metadata", transportedMetadata);
        
        // transported data are optimized for transport, not for use.
        // one-time transform for easier use. Changing from tile-centered to object-centered representation.
        var metadata = Object.create(null)
        transportedMetadata.forEach(function(tileMetadata){
            Object.keys(tileMetadata.objects).forEach(function(objId){
                var objMetadata = tileMetadata.objects[objId];
                
                objMetadata.tile = tileMetadata;
                
                metadata[objId] = objMetadata;
            });     
            delete tileMetadata.objects;
        });
        transportedMetadata = undefined;
        
        console.log("processed metadata", metadata);
        
        resolve(metadata);
    });
});

function getCityObject(id){
    socket.emit('object', {id : id});
}

// when receiving a building parse it
socket.on('building', function(msg){
    
    metadataP.then(function(metadata){
        var buildingMetadata = metadata[msg.id];
        if(msg.buffer){
            var mesh = createBuildingMesh(new DataView(msg.buffer), buildingMetadata.tile);

            meshToBuilding.set(mesh, {id: msg.id, metadata: buildingMetadata}); 
            scene.add(mesh);

            buildingMap[msg.id] = {mesh:mesh, visible:true};
            
            msg = undefined; // loose references to the binary buffer
        }
        else{
            // for whatever reason, sometimes, there is no msg.buffer property. Maybe socket.io messes up or something
            // anyway, usually, retrying getting the object works
            // In case it doesn't work, this will create a really bad infinite loop
            setTimeout(function(){
                getCityObject(msg.id);
            }, 100); // arbitrary amount of time
        }
    }).catch(function(err){
        console.error(err);
    });
});



module.exports = {
    metadataP: metadataP,
    getCityObject: getCityObject
}