"use strict";

var defaultControls = require('city-blocks/controls/FirstPerson_Basic.js');

var createThreeBundle = require('./createThreeBundle.js');
var _server = require('./serverCommunication.js');
var rTree = require('./rTree.js');
var getMetadata = require('./getMetadata.js');
var MAX_Y = require('./MAX_Y');
var createBuildingMesh = require('./createBuildingMesh.js');
var meshToBuilding = require('./meshToBuilding.js');
var buildingMap = require('./buildingMap.js');
var _loadObjects = require('./loadObjects.js');

/*
    * créer une API pour les metadata côté serveur
    * 2 APIs pour fetcher les batiments. 
        * Une par zone géographique (quand le client n'a pas les metadata)
        * Une batiment par batiment (comme actuellement)
*/


module.exports = function(container, buildingServerOrigin, options){
    if(!container)
        throw new Error('Missing container arguement (HTMLElement)');
    if(typeof buildingServerOrigin !== 'string')
        throw new Error('Missing buildingServerOrigin argument. Must be a string like "https://city-core-api.ants.builders:3333"')
    
    var server = _server(buildingServerOrigin);


    var rtreeReadyP = getMetadata(buildingServerOrigin).then(function(metadata){
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
    
    
    var threeBundle = createThreeBundle(container, buildingServerOrigin+'/img/sky.jpg');

    var camera = threeBundle.camera;
    var scene = threeBundle.scene;
    var domElement = threeBundle.domElement;

    var loadObjects = _loadObjects(server.getCityObject);
    
    camera.on('cameraviewchange', function(){
        //console.log('cameraviewchange', camera.position.x, camera.position.y, camera.position.z );
        
        threeBundle.render();
    });

    server.on('buildingOk', function(event){
        console.log('building');
        var mesh = createBuildingMesh(new DataView(event.msg.buffer), event.buildingMetadata.tile);

        meshToBuilding.set(mesh, {id: event.msg.id, metadata: event.buildingMetadata}); 
        scene.add(mesh);

        buildingMap.set(event.msg.id, {mesh:mesh, visible:true});

        threeBundle.render();
    });

    return rtreeReadyP.then(function(){
        var currentControlsDesactivate = defaultControls(camera, scene, domElement, loadObjects);
        
        return {
            addLight: function(light /*: THREE.Light */){
                scene.add(light);
            },
            removeLight: function(light /*: THREE.Light */){
                throw 'TODO';
            },

            // functions to add tramway or another building
            addMesh: function(mesh /*: THREE.Mesh */){
                scene.add(mesh);
            },
            removeMesh: function(mesh /*: THREE.Mesh */){
                throw 'TODO';
            },

            changeControls: function(controls, position){
                currentControlsDesactivate();

                console.log('about to change controls', camera.position.x, camera.position.y, camera.position.z, position);

                if(position){
                    camera.position.x = 'x' in position ? position.x : camera.position.x;
                    camera.position.y = 'y' in position ? position.y : camera.position.y;
                    camera.position.z = 'z' in position ? position.z : camera.position.z;
                }

                currentControlsDesactivate = controls(camera, scene, domElement, loadObjects);
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
            },
            camera : camera,
            scene: scene
        };
    });
    
}