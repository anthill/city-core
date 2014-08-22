'use strict';

var SkyViewControls = require('./controls/SkyViewControls.js');
var FirstPersonControls = require('./controls/FirstPersonControls.js');

var desactivateCurrentControls = function(){};
var lastAltitude;


module.exports = function(camera, domElement, weakMap){
    var skyViewControls = SkyViewControls(camera, domElement);
    var firstPersonControls = FirstPersonControls(camera, domElement);
    
    var ret = {
        switchToFirstPersonView: function(x, y){
            desactivateCurrentControls();
            lastAltitude = camera.position.z;
            desactivateCurrentControls = firstPersonControls(x, y);
        },
        switchToSkyView: function(x, y, altitude){
            console.log('switchToSkyView', x, y, altitude);
            desactivateCurrentControls();
            desactivateCurrentControls = skyViewControls(x, y, altitude || lastAltitude);
        }
    };
    
    window.addEventListener( 'meshClicked', function onMeshClicked(event){
        var detail = event.detail;
        console.log('Id', weakMap.get(detail.mesh).id);
        console.log('Intersection point', detail.point.x, detail.point.y, detail.point.z);
        
        ret.switchToFirstPersonView(detail.point.x, detail.point.y);
        
        window.removeEventListener('meshClicked', onMeshClicked);
        
    } );
    
    
    
    return ret;
}


