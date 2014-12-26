"use strict";

var defaultControls = require('bordeaux3d-blocks/controls/FirstPerson_Basic.js');

var createThreeBundle = require('./createThreeBundle.js');
var server = require('./serverCommunication.js');
var rTree = require('./rTree.js');
var metadataP = require('./metadataP.js');
var MAX_Y = require('./MAX_Y');
var createBuildingMesh = require('./createBuildingMesh.js');
var meshToBuilding = require('./meshToBuilding.js');
var buildingMap = require('./buildingMap.js');
var loadObjects = require('./loadObjects.js');

metadataP.then(function(metadata){
    Object.keys(metadata).forEach(function(id) {
        var building = metadata[id];
        var X = building.tile.X;
        var Y = building.tile.Y;
        var item = [
            building.x + X*200,
            building.y + (MAX_Y-Y)*200,
            building.x + X*200,
            building.y + (MAX_Y-Y)*200,
            {id: id, X:X, Y:Y}
        ];
        rTree.insert(item);
    });
}).catch(function(err){
    console.error('error getting metadata or filling rtree', err);
});
    

/*
    * ne plus intégrer metadata.json dans le html
    * créer une API pour les metadata côté serveur
    * 2 APIs pour fetcher les batiments. 
        * Une par zone géographique (quand le client n'a pas les metadata)
        * Une batiment par batiment (comme actuellement)
*/


module.exports = function(container, options){

    var threeBundle = createThreeBundle(container);

    var camera = threeBundle.camera;
    var scene = threeBundle.scene;
    var domElement = threeBundle.domElement;

    camera.on('cameraviewchange', function(){
        //console.log('cameraviewchange', camera.position.x, camera.position.y, camera.position.z );
        
        threeBundle.render();
    });

    server.on('buildingOk', function(event){
        console.log('building')
        var mesh = createBuildingMesh(new DataView(event.msg.buffer), event.buildingMetadata.tile);

        if(event.buildingMetadata.type === "building"){
            mesh.castShadow = true;
            mesh.receiveShadow = false;
        } else {
            mesh.castShadow = false;
            mesh.receiveShadow = true;
        }

        meshToBuilding.set(mesh, {id: event.msg.id, metadata: event.buildingMetadata}); 
        scene.add(mesh);

        buildingMap.set(event.msg.id, {mesh:mesh, visible:true});

        threeBundle.render();
    });
    
    var INITIAL_ALTITUDE = 200;

    camera.position.x = 24341.22;
    camera.position.y = 10967.65;

    var currentControlsDesactivate = defaultControls(camera, scene, domElement, loadObjects)(24341.22, 10967.65); // not empty
 
    return {
        addLight: function(light /*: THREE.Light */){
            throw 'TODO';
        },
        removeLight: function(light /*: THREE.Light */){
            throw 'TODO';
        },

        // functions to add tramway or another building
        addMesh: function(mesh /*: THREE.Mesh */){
            throw 'TODO';
        },
        removeMesh: function(mesh /*: THREE.Mesh */){
            throw 'TODO';
        },

        changeControls: function(controls){
            currentControlsDesactivate();
            currentControlsDesactivate = controls(camera, scene, domElement);
        },
        // trigger a render
        render: threeBundle.render,
        // loads the buildings as well as metadata
        // used by custom controls
        loadCityPortion: function(north, east, south, west){
            throw 'TODO';
        },        
        loadBuildings: function(buildingIds){
            // TODO redo server-protocol to send the array directly
            buildingIds.forEach(function(id){
                server.getCityObject(id);
            });
        }

    };
}