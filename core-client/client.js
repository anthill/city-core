"use strict";

// watchify core-client/client.js -o core-client/app.js -d -v
// node server.js dev core-client

var bordeaux3dCore = require('../front/src/index.js');

var SkyViewControls = require('city-blocks/controls/SkyView_Basic.js');
var FirstPersonControls = require('city-blocks/controls/FirstPerson_Basic.js');


var bordeaux3D = bordeaux3dCore(document.querySelector('#view'));


var controlsButton = document.querySelector('button#controls');


function onMeshClicked(event){
    var detail = event.detail;
    console.log('Id', meshToBuilding.get(detail.mesh).id);
    console.log('Intersection point', detail.point.x, detail.point.y, detail.point.z); 

    ret.switchToFirstPersonView(detail.point.x, detail.point.y);
}

var nextControls = "sky";
var buttonMessage = Object.freeze({
    "first person" : "switch to sky controls",
    "sky" : "switch to first person controls",
});

var skyViewAltitude = 200;

// initial position
bordeaux3D.camera.position.x = 24341.22;
bordeaux3D.camera.position.y = 10967.65;
bordeaux3D.camera.position.z = skyViewAltitude;

function toggleControls(){
    console.log('toggleControls', nextControls);
    
    if(nextControls === "sky"){
        bordeaux3D.changeControls(SkyViewControls, { z: skyViewAltitude });
        //window.addEventListener('meshClicked', onMeshClicked);
        controlsButton.textContent = buttonMessage[nextControls];
        
        nextControls = "first person";
    }
    else{
        skyViewAltitude = bordeaux3D.camera.position.z;
        bordeaux3D.changeControls(FirstPersonControls);
        //window.removeEventListener('meshClicked', onMeshClicked);
        controlsButton.textContent = buttonMessage[nextControls];
        
        nextControls = "sky";
    }
}
toggleControls();



controlsButton.addEventListener('click', toggleControls);
