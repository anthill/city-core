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

// when receiving a building parse it
socket.on('building', function(msg){
    
    metadataP.then(function(metadata){
        var buildingMetadata = metadata[msg.id];
        var mesh = createBuildingMesh(new DataView(msg.buffer), buildingMetadata.tile);
        
        meshToBuilding.set(mesh, {id: msg.id, metadata: buildingMetadata, buffer: msg.buffer});
        scene.add(mesh);
        
        buildingMap.set(msg.id, {mesh:mesh, visible:true});
    }).catch(function(err){
        console.error(err);
    });
});

module.exports = {
    metadataP: metadataP,
    socket: socket
}