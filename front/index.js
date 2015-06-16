"use strict";

var defaultControls = require('city-blocks/controls/FirstPerson_Basic.js');

var _server = require('./serverCommunication.js');
var rTree = require('./rTree.js');
var getMetadata = require('./getMetadata.js');
var MAX_Y = require('./MAX_Y');
var infosFromMesh = require('./infosFromMesh.js');
var meshFromId = require('./meshFromId.js');
var meshColor = require('./meshDefaultColor.js');
var _loadFunctions = require('./loadFunctions.js');
var createThreeBundle = require('./createThreeBundle.js');

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

    var loadFunctions = _loadFunctions(server.getCityObject);
    
    camera.on('cameraviewchange', function(){
        //console.log('cameraviewchange', camera.position.x, camera.position.y, camera.position.z );
        threeBundle.render();
    });

    server.on('buildingOk', function(event){
        threeBundle.render();
    });

    return rtreeReadyP.then(function(){
        var currentControlsDesactivate = defaultControls(camera, scene, domElement, loadFunctions);
        
        return {

            // TODO => maybe register lights in a map like we do for meshes?
            addLight: function(light /*: THREE.Light */){
                scene.add(light);
            },
            removeLight: function(light /*: THREE.Light */){
                scene.remove(light);
            },

            // functions to add tramway or another building
            addMesh: function(mesh /*: THREE.Mesh */){

                // TODO => we should probably fill in infosFromMesh and meshFromId, but how to ask for metadata infos ???
                scene.add(mesh);
            },
            removeMesh: function(mesh /*: THREE.Mesh */){
                console.log('Remove building');

                infosFromMesh.delete(mesh);
                meshFromId.delete(id);
                
                scene.remove(mesh);
            },

            changeControls: function(controls, position){
                currentControlsDesactivate();

                console.log('about to change controls', camera.position.x, camera.position.y, camera.position.z, position);

                if(position){
                    camera.position.x = 'x' in position ? position.x : camera.position.x;
                    camera.position.y = 'y' in position ? position.y : camera.position.y;
                    camera.position.z = 'z' in position ? position.z : camera.position.z;
                }

                currentControlsDesactivate = controls(camera, scene, domElement, loadFunctions);
            },
            getMeshFromRay: function(ray){
                console.log('Finding mesh');
                var out = ray.intersectObjects(scene.children, false);

                return out[0];
            },
            // trigger a render
            render: threeBundle.render,
            camera : camera,
            meshFromId: meshFromId,
            infosFromMesh: infosFromMesh
        };
    });
    
}