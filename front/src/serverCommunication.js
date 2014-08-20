'use strict';

var io = require('socket.io-client');
var buildingMap = require('./buildingMap.js');
var createBuildingMesh = require('./createBuildingMesh.js');
var scene = require('./3dviz').scene;

//socket
var socket = io();
var metadataP = new Promise(function(resolve){
    socket.on('endpoint', function(msg){
        console.log("endpoint", msg);
        
        var metadata = JSON.parse(msg.metadata);
        resolve(metadata);
    });
});

// when receiving a building parse it
socket.on('building', function(msg){
    
    metadataP.then(function(metadata){
        var buildingMetadata = metadata[msg.id];
        var mesh = createBuildingMesh(new DataView(msg.buffer), buildingMetadata.X, buildingMetadata.Y);
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