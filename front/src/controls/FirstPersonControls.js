'use strict';

/*
    * Move mouse: look around
    * Mouse down: move forward
    * Mouse up: stop moving forward
*/

var THREE = require('three');
var _getFloorHeight = require('../distanceToFloor.js');

var cos = Math.cos,
    sin = Math.sin,
    pow = Math.pow;

var HEIGHT = 6;

var DISTANCE_TO_LOOK_AT = 20;
var MAX_HORI_SPEED = Math.PI/100;
var MAX_VERTI_SPEED = Math.PI/120;


module.exports = function(camera, scene, domElement){
    
    var getFloorHeight = _getFloorHeight(scene);
    
    var alpha;
    var beta;
    var animationFrame;
    var rotation = 0;
    
    var lookAtPoint;


    var movementX, movementY;
    var PI = Math.PI;


    // TACTILE VERSION    
    // function moveCamera(){
    //     // var newx = camera.position.x +
    //     //     ((lookAtPoint.x - camera.position.x)*cos(alpha) - (lookAtPoint.y - camera.position.y)*sin(alpha));
    //     // var newy = camera.position.y +
    //     //     ((lookAtPoint.x - camera.position.x)*sin(alpha) + (lookAtPoint.y - camera.position.y)*cos(alpha));
    //     // var newz = lookAtPoint.z + 20*DISTANCE_TO_LOOK_AT * Math.sin(beta);

    //     // lookAtPoint.x = newx;
    //     // lookAtPoint.y = newy;
    //     // lookAtPoint.z = newz;

    //     // camera.lookAt( lookAtPoint );
    //     // rotation += alpha; 

    //     animationFrame = requestAnimationFrame(moveCamera);
    //     // alpha = 0;
    //     // beta = 0;
    // }

    // TACTILE VERSION
    // function mouseMoveListener(e){
    //     var canvasBoundingRect = domElement.getBoundingClientRect();

    //     // var deltaX = e.clientX - canvasBoundingRect.width/2;
    //     // var deltaZ = e.clientY - canvasBoundingRect.height/2;

    //     var posX = (e.clientX - canvasBoundingRect.width/2)/canvasBoundingRect.width;
    //     var posY = (e.clientY - canvasBoundingRect.height/2)/canvasBoundingRect.height;

    //     // var deltaX = (Math.abs(posX - lastMouseX) > 0.01) ? lastMouseX - posX : 0;
    //     // var deltaZ = (Math.abs(posY - lastMouseY) > 0.01) ? lastMouseY - posY : 0;

    //     if (Math.abs(posX - lastMouseX) > 0.01){
    //         alpha = lastMouseX - posX;
    //         beta = posY/10;
    //     } else {
    //         alpha = 0;
    //         beta = 0;
    //     }
        
    //     lastMouseX = posX;
    //     lastMouseY = posY;

    //     // console.log("deltaX: " + posX + " | deltaZ: " + posY);

        

    //     // if(Math.abs(deltaX) > canvasBoundingRect.width*1/10 || Math.abs(deltaZ) > canvasBoundingRect.height*1/10){

    //     //     if (Math.abs(deltaX) > canvasBoundingRect.width*1/10){
    //     //         alpha = MAX_HORI_SPEED *
    //     //             (Math.abs(deltaX) - canvasBoundingRect.width*1/10)/
    //     //             (canvasBoundingRect.width/2 - canvasBoundingRect.width*1/10);
    //     //         if(deltaX > 0)
    //     //             alpha = -alpha;
    //     //     } else {alpha = 0}
    //     //     if (Math.abs(deltaZ) > canvasBoundingRect.height*1/10){
    //     //         beta = MAX_VERTI_SPEED *
    //     //             (Math.abs(deltaZ) - canvasBoundingRect.height*1/10)/
    //     //             (canvasBoundingRect.height/2 - canvasBoundingRect.height*1/10);
    //     //         if(deltaZ > 0)
    //     //             beta = -beta;
    //     //     } else { beta = 0}

    //         if(!animationFrame)
    //             animationFrame = requestAnimationFrame(moveCamera)
    //     // }
    //     // else{
    //     //     cancelAnimationFrame(animationFrame);
    //     //     animationFrame = undefined;
    //     // }
    // }


    function moveCallback(event) {

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        var yawQuat = new THREE.Quaternion(0,0,0,1);
        var pitchQuat = new THREE.Quaternion(0,0,0,1);
        var combinedQuat = new THREE.Quaternion(0,0,0,1);

        var axis = new THREE.Vector3();
        axis.crossVectors(camera.direction, camera.up);

        yawQuat.setFromAxisAngle( camera.up, -movementX * 0.005);
        pitchQuat.setFromAxisAngle( axis, -movementY * 0.005);

        combinedQuat.multiplyQuaternions(yawQuat, pitchQuat);

        // camera.quaternion = quaternion;
        var direction = camera.direction;
        direction.applyQuaternion(combinedQuat);

        var newLookAt = new THREE.Vector3(0,0,0);

        newLookAt.addVectors(camera.position, direction);
        console.log("Temp: " + newLookAt.x + " | " + newLookAt.y + " | " + newLookAt.z);

        camera.lookAt(newLookAt);

        // camera.rotation.y -= movementX * 0.002;
        // camera.rotation.x -= movementY * 0.002;

        // camera.rotation.x = Math.max( - PI, Math.min( PI, camera.rotation.x ) );
    }

    // TACTILE VERSION
    // function moveCallback(event) {
        // alpha = e.movementX ||
        //     e.mozMovementX          ||
        //     e.webkitMovementX       ||
        //     0;
        // beta = e.movementY ||
        //     e.mozMovementY      ||
        //     e.webkitMovementY   ||
        //     0;
        
        // if(!animationFrame)
        //     animationFrame = requestAnimationFrame(moveCamera);

        // alpha *= -0.004;
        // beta *= -0.0003;

        // console.log("alpha: " + alpha + " | beta: " + beta);
    // }

    var moveAnimationFrame;
    var SPEED = 0.05;


    // TACTILE VERSION
    // function mouseDownListener(){

    //     moveAnimationFrame = requestAnimationFrame(function moveForward(){

    //         var moveVector = {
    //             x : lookAtPoint.x - camera.position.x,
    //             y : lookAtPoint.y - camera.position.y,
    //         };
    //         camera.position.x += SPEED*moveVector.x;
    //         lookAtPoint.x     += SPEED*moveVector.x;
    //         camera.position.y += SPEED*moveVector.y;
    //         lookAtPoint.y     += SPEED*moveVector.y;
            
    //         var rayCasterPosition = camera.position;
    //         rayCasterPosition.z = 10000;
    //         var distanceToFloor = getFloorHeight(rayCasterPosition);
    //         if(distanceToFloor !== undefined){
    //             camera.position.z += HEIGHT - distanceToFloor;
    //         }
            
    //         moveAnimationFrame = requestAnimationFrame(moveForward);
    //     });
    // }

    // function mouseUpListener(){
    //     cancelAnimationFrame(moveAnimationFrame);
    //     moveAnimationFrame = undefined;
    // }

    // function pan ( direction ) {
    //     var camx = camera.position.x + direction.x*userPanSpeed;
    //     var camy = camera.position.y + direction.y*userPanSpeed;
    //     camera.position.x = camx;
    //     camera.position.y = camy;

    //     // camera.lookAt( new THREE.Vector3( camx, camy, 0 ) );
    // }

    function onKeyDown( event ) {
        console.log('keypress', event.keyCode);
        switch ( event.keyCode ) {
            case keys.UP:
                pan( new THREE.Vector3( 0, 1, 0 ) );
                event.preventDefault();
                break;
            case keys.BOTTOM:
                pan( new THREE.Vector3( 0, - 1, 0 ) );
                event.preventDefault();
                break;
            case keys.LEFT:
                pan( new THREE.Vector3( - 1, 0, 0 ) );
                event.preventDefault();
                break;
            case keys.RIGHT:
                pan( new THREE.Vector3( 1, 0, 0 ) );
                event.preventDefault();
                break;
        }
    }
    
    
    return function(x, y){
        var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

        console.log("PointerLock: " + havePointerLock);

        document.body.requestPointerLock = document.body.requestPointerLock ||
            document.body.mozRequestPointerLock ||
            document.body.webkitRequestPointerLock;
        // Ask the browser to lock the pointer
        document.body.requestPointerLock();

        camera.up = new THREE.Vector3(0, 0, 1);
        camera.near = 1;
        camera.far = 50;
        
        var rayCasterPosition = camera.position;
        rayCasterPosition.z = 10000;
        var distanceToFloor = getFloorHeight(rayCasterPosition);
        console.log('distance to floor', distanceToFloor, camera.position.z + HEIGHT - distanceToFloor)
        
        // init camera
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = distanceToFloor !== undefined ? camera.position.z + HEIGHT - distanceToFloor : HEIGHT;

        // Looking north
        lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE_TO_LOOK_AT, camera.position.z )
        camera.lookAt( lookAtPoint );

        // domElement.addEventListener('mousemove', mouseMoveListener);
        // domElement.addEventListener('mousedown', mouseDownListener);
        // domElement.addEventListener('mouseup', mouseUpListener);
        window.addEventListener('keydown', onKeyDown);

        document.body.addEventListener("mousemove", moveCallback, false);

        // if (document.pointerLockElement === document.body ||
        //     document.mozPointerLockElement === document.body ||
        //     document.webkitPointerLockElement === document.body) {
        //     // Pointer was just locked
        //     // Enable the mousemove listener
        //     console.log("good");
        //     document.addEventListener("mousemove", moveCallback, false);
        // } else {
        //     console.log("not good");
        //     document.removeEventListener("mousemove", moveCallback, false);
        //     unlockHook(document.body);
        // }

        return function desactivate(){

            document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;
            document.exitPointerLock();

            // domElement.removeEventListener('mousemove', mouseMoveListener);
            // domElement.removeEventListener('mousedown', mouseDownListener);
            // domElement.removeEventListener('mouseup', mouseUpListener);
            window.removeEventListener('keydown', onKeyDown);

            document.body.removeEventListener("mousemove", moveCallback, false);
            document.exitPointerLock();

            cancelAnimationFrame(moveAnimationFrame);
            moveAnimationFrame = undefined;
        };
    }
    
};