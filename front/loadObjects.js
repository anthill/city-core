'use strict';

var Map = require('es6-map');

var rTree = require('./rTree.js');
var buildingCache = require('./buildingCache.js');
var unpackBuilding = require('./unpackBuilding.js');
var infosFromMesh = require('./infosFromMesh.js');
var meshFromId = require('./meshFromId.js');
var LimitedEntryMap = require('./LimitedEntryMap.js');
// var meshColor = require('../common/meshDefaultColor.js');

function distance(a, b){
    return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
}

module.exports = function(getCityObject){

    function Fast(scene, point, distance) {
        // query the rtree to know what building are needed

        var nbToLoad = 0;

        var south = point.y - distance;
        var north = point.y + distance;
        var west = point.x - distance;
        var east = point.x + distance;

        var results = rTree.search([west, south, east, north]);

        var objectRequestedIds = new Set(results.map(function(r){ return r[4].id; }));

        // in requested zone ...
        objectRequestedIds.forEach(function(id){

            // ... and in meshFromId (is already in scene) => do nothing

            // ... and not in meshFromId (not in scene) => request building
            if (!meshFromId.has(id)){
                nbToLoad ++;

                getCityObject(id)
                .then(function(object){
                    var mesh = unpackBuilding(object);
                    scene.add(mesh);
                });
            }
                
        });

        console.log('nb Visible', meshFromId.size, 'requestedIds', objectRequestedIds.size, 'nbToLoad', nbToLoad);
    };
    
    function Zone(scene, camera, domElement) {
        // query the rtree to know what building are needed
        var nbToLoad = 0;

        var position = camera.position;

        var L = 2 * camera.position.z * Math.tan(Math.PI*camera.fov/(2*180));
        var l = L * domElement.clientWidth / domElement.clientHeight;

        var south = position.y - L/2;
        var north = position.y + L/2;
        var west = position.x - l/2;
        var east = position.x + l/2;
        
        // ask for a little extra
        west -= 100;
        south -= 100;
        east += 100;
        north += 100;

        var resultsBase = rTree.search([west, south, east, north]);
        var resultsExtended = rTree.search([west-100, south-100, east+100, north+100]);

        // in base and extended zones
        var objectRequestedIdsBase = new Set(resultsBase.map(function(r){ return r[4].id; }));
        var objectRequestedIdsExtended = new Set(resultsExtended.map(function(r){ return r[4].id; }));

        // in extended zone ...
        objectRequestedIdsExtended.forEach(function(id){
            
            // ... but not in scene => ask for buildings
            if (!meshFromId.has(id)){
                nbToLoad ++;
                
                getCityObject(id)
                .then(function(object){
                    // if also in base zone, add mesh to scene
                    if (objectRequestedIdsBase.has(id)){
                        var mesh = unpackBuilding(object);
                        scene.add(mesh);
                    }
                });
            }
        });

        var nbToHide = 0;

        // in base zone but too far => hide
        meshFromId.forEach(function(mesh, id){
            if (infosFromMesh.get(mesh).type === 'building' && distance(mesh.position, camera.position) > 1000) {
                nbToHide ++;
                scene.remove(mesh);
                infosFromMesh.delete(meshFromId.delete(id));
            }
        });

        console.log('extendedIds', objectRequestedIdsExtended.size, 'baseIds', objectRequestedIdsBase.size,  'buildingCache', buildingCache.size);
        console.log('nbToLoad', nbToLoad, 'nbVisible', meshFromId.size, 'nbToHide', nbToHide);
    };
    
    return {
        fast: Fast,
        zone: Zone
    };
}