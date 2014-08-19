'use strict';

var rTree = require('./rTree.js');
var buildingMap = require('./buildingMap.js');
var socket = require('./serverCommunication.js').socket;
var scene = require('./3dviz.js').scene;

module.exports = function loadTiles(south, north, east, west) {
    console.log("query", south, north, east, west);
    // query the rtree to know what building are needed
    var results = rTree.search([west, south, east, north]);

    console.log("query results", results);

    //remove all buildings from scene
    buildingMap.forEach(function(building){
        building.visible = false;
        scene.remove(building.mesh);
    });

    results.forEach(function(result) {
        if (buildingMap.has(result[4].id) === false){
            // not in the map => ask the backend
            socket.emit('object', {id : result[4].id});
        } else { // in the map
            var entry = buildingMap.get(result[4].id);
            // if not visible, added back to the scene
            scene.add(entry.mesh);
            entry.visible = true;
        }

    });
}