'use strict';

var Set = require('es6-set');

var rTree = require('./rTree.js');
var buildingMap = require('./buildingMap.js');
var fetchCityObject = require('./serverCommunication.js').getCityObject;
var scene = require('./3dviz.js').scene;


module.exports = function loadObjects(south, north, east, west) {
    //console.log("query", south, north, east, west);
    // query the rtree to know what building are needed
    var results = rTree.search([west, south, east, north]);
    
    var objectToDisplayIds = new Set(results.map(function(r){ return r[4].id; }));
    var displayedObjectIds = new Set(Object.keys(buildingMap).filter(function(k){ return buildingMap[k].visible; }));
    
    // add objects which should be visible but aren't
    objectToDisplayIds.forEach(function(id){
        if(!(id in buildingMap)){
            fetchCityObject(id); // object will be added to scene in serverCommunication.js, which is a terrible place, yes.
        }
        else{
            var entry = buildingMap[id]
            
            if(!entry.visible){
                scene.add(entry.mesh);
                entry.visible = true;
            }
        }
    });
    
    // hide objects which are visible, but shouldn't
    displayedObjectIds.forEach(function(id){
        if(!objectToDisplayIds.has(id)){
            var object = buildingMap[id];
            object.visible = false;
            scene.remove(object.mesh);
        }    
    });

}