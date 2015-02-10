'use strict';

var Map = require('es6-map');

var rTree = require('./rTree.js');
var unpackBuilding = require('./unpackBuilding.js');
var infosFromMesh = require('./infosFromMesh.js');
var meshFromId = require('./meshFromId.js');
var LimitedEntryMap = require('./LimitedEntryMap.js');

module.exports = function(getCityObject){

    function getIDsFromPoint(point, distance){
        var south = point.y - distance;
        var north = point.y + distance;
        var west = point.x - distance;
        var east = point.x + distance;

        var results = rTree.search([west, south, east, north]);

        // return only the IDs from results, which is a complex object it seems :/
        return new Set(results.map(function(r){ return r[4].id; }));
    }

    // TODO => This function should be written using the actual view of the camera, not its position
    function getIDsFromCamera(camera, extra){
        var position = camera.position;

        var L = 2 * camera.position.z * Math.tan(Math.PI*camera.fov/(2*180));
        var l = L * camera.aspect;

        var south = position.y - L/2;
        var north = position.y + L/2;
        var west = position.x - l/2;
        var east = position.x + l/2;
        
        // ask for a little extra
        west -= extra;
        south -= extra;
        east += extra;
        north += extra;

        var results = rTree.search([west, south, east, north]);

        // return only the IDs from results, which is a complex object it seems :/
        return new Set(results.map(function(r){ return r[4].id; }));
    }

    function loadObjects(scene, Ids) {
        var nbToLoad = 0;
        Ids.forEach(function(id){
            // If not in meshFromId (not in scene) => request building
            if (!meshFromId.has(id)){
                nbToLoad ++;

                getCityObject(id)
                .then(function(object){
                    var mesh = unpackBuilding(object);
                    scene.add(mesh);
                });
            }
        });

        console.log('LOADING', nbToLoad);
    }

    // TODO => Answer this: Do we need to give more flexibility to users concerning the hiding buildings policy ??
    // PLUS => This in another function ?? It's not really a load function, but still there is some congruency
    function hideObjects(scene, camera, distance){
        // if mesh too far => hide
        var nbToHide = 0;

        meshFromId.forEach(function(mesh, id){
            var dX = mesh.position.x - camera.position.x;
            var dY = mesh.position.y - camera.position.y;
            if (infosFromMesh.get(mesh).type === 'building' && Math.hypot(dX, dY) > distance) {
                nbToHide ++;

                infosFromMesh.delete(mesh);
                meshFromId.delete(id);

                scene.remove(mesh);
            }
        });

        console.log('HIDDEN:', nbToHide);
    }
    
    return {
        getIDsFromPoint: getIDsFromPoint,
        getIDsFromCamera: getIDsFromCamera,
        loadObjects: loadObjects,
        hideObjects: hideObjects
    };
}