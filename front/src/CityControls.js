'use strict';

var SkyViewControls = require('./controls/SkyView_RTS.js');
var FirstPersonControls = require('./controls/FirstPerson_PointerLock.js');
// var SkyViewControls = require('./controls/SkyView_Basic.js');
// var FirstPersonControls = require('./controls/FirstPerson_Basic.js');
var loadObjects = require('./loadObjects.js');
var meshToBuilding = require('./meshToBuilding');

var desactivateCurrentControls = function(){};
var lastAltitude;


module.exports = function(camera, scene, domElement){
    var skyViewControls = SkyViewControls(camera, domElement);
    var firstPersonControls = FirstPersonControls(camera, scene, domElement);
    
    function onCameraViewChangeSky(){
        var L = 2 * camera.position.z * Math.tan(3.14*camera.fov/(2*180));
        var l = L * window.innerWidth / window.innerHeight;

        var south = camera.position.y - L/2;
        var north = camera.position.y + L/2;
        var west = camera.position.x - l/2;
        var east = camera.position.x + l/2;
        
        // ask for a little extra
        west -= 200;
        south -= 200;
        east += 200;
        north += 200;

        loadObjects(south, north, east, west);
    }

    function onCameraViewChangeFirstPerson(){
        var south = camera.position.y - 300;
        var north = camera.position.y + 300;
        var west = camera.position.x - 300;
        var east = camera.position.x + 300;

        loadObjects(south, north, east, west);
    }
    
    function onMeshClicked(event){
        var detail = event.detail;
        console.log('Id', meshToBuilding.get(detail.mesh).id);
        console.log('Intersection point', detail.point.x, detail.point.y, detail.point.z);
        
        ret.switchToFirstPersonView(detail.point.x, detail.point.y);
    }
    
    function onKeyPressFirstPerson(e){
        console.log('key press while first person', e.keyCode);
        if(e.keyCode === 27){ // escape
            e.preventDefault();
            ret.switchToSkyView(camera.position.x, camera.position.y);
        }
    }
    
    
    var ret = {
        switchToFirstPersonView: function(x, y){
            desactivateCurrentControls();
            window.removeEventListener('meshClicked', onMeshClicked);
            camera.off('cameraviewchange', onCameraViewChangeSky);
            camera.on('cameraviewchange', onCameraViewChangeFirstPerson);
            document.addEventListener('keydown', onKeyPressFirstPerson);
            
            lastAltitude = camera.position.z;
            
            desactivateCurrentControls = firstPersonControls(x, y);
        },
        switchToSkyView: function(x, y, altitude){
            desactivateCurrentControls();
            window.addEventListener( 'meshClicked', onMeshClicked);
            camera.off('cameraviewchange', onCameraViewChangeFirstPerson);
            camera.on('cameraviewchange', onCameraViewChangeSky);
            document.removeEventListener('keydown', onKeyPressFirstPerson);
            
            desactivateCurrentControls = skyViewControls(x, y, altitude || lastAltitude);
        }
    };
    
    return ret;
}


