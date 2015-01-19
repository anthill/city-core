'use strict';

var Set = require('es6-set');

var rTree = require('./rTree.js');
var buildingMap = require('./buildingMap.js');


module.exports = function(fetchCityObject){
    
    return function loadObjects(scene, south, north, east, west) {
        // query the rtree to know what building are needed
        var results = rTree.search([west, south, east, north]);

        var objectToDisplayIds = new Set(results.map(function(r){ return r[4].id; }));
        var displayedObjectIds = new Set(buildingMap.keys().filter(function(id){ return buildingMap.get(id).visible; }));

        // add objects which should be visible but aren't
        objectToDisplayIds.forEach(function(id){
            if(!buildingMap.has(id)){
                fetchCityObject(id); // object will be added to scene in serverCommunication.js, which is a terrible place, yes.
            }
            else{
                var entry = buildingMap.get(id);

                if(!entry.visible){
                    scene.add(entry.mesh);
                    entry.visible = true;
                }
            }
        });

        // hide objects which are visible, but shouldn't
        displayedObjectIds.forEach(function(id){
            if(!objectToDisplayIds.has(id)){
                var object = buildingMap.get(id);
                object.visible = false;
                scene.remove(object.mesh);
            }    
        });

    };
    
}