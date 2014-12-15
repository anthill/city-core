'use strict';

/*
    FPS Style
    body mouvement is handled by Z,Q,S,D keys
*/

var THREE = require('three');
var _getFloorHeight = require('../distanceToFloor.js');

var cos = Math.cos,
    sin = Math.sin,
    pow = Math.pow;

var HEIGHT = 1.8;

var DISTANCE_TO_LOOK_AT = 20;

var PITCH_SPEED = 0.005;
var YAW_SPEED = 0.005;
var BODY_SPEED = 4;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;


module.exports = function(camera, scene, domElement){

    
    
    var getFloorHeight = _getFloorHeight(scene);
    var lookAtPoint;
    var prevTime;
    var deltaPosition = new THREE.Vector3(0,0,0);
    var movementX, movementY;
    var previousDistanceToFloor;


    function updateCamera(){

        // delta is for smoothing movement according to framerate performances.
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        var rayCasterPosition = camera.position;
        rayCasterPosition.z = 10000;
        var distanceToFloor = getFloorHeight(rayCasterPosition);

        // Position camera above the closest floor
        // causes problems for lookAt behaviour when jumping on buildings roofs
        if(distanceToFloor !== undefined){
            camera.position.z += HEIGHT - distanceToFloor;
            if (previousDistanceToFloor !== undefined){
                var deltaHeight = distanceToFloor - previousDistanceToFloor;
                lookAtPoint.z -= deltaHeight;
            }
        }

        deltaPosition.multiplyScalar(BODY_SPEED * delta);

        camera.position.add(deltaPosition);
        lookAtPoint.add(deltaPosition);

        // console.log("Position: x " + camera.position.x + " | y " + camera.position.y + " | z " + camera.position.z);
        console.log("Direction: x " + camera.direction.x + " | y " + camera.direction.y + " | z " + camera.direction.z);
        console.log("lookAt Z: " + camera.lookAtVector.z);

        prevTime = time;
        deltaPosition.x = 0;
        deltaPosition.y = 0;
        previousDistanceToFloor = distanceToFloor;

        // See headMovement commentaries
        camera.lookAt(lookAtPoint);
    }


    function headMovement(event) {

        // Get mouse differential movements
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Create pitch axis
        var axis = new THREE.Vector3();
        axis.crossVectors(camera.direction, camera.up);

        // Create quaternions for pitch and yaw, then combine them
        var yawQuat = new THREE.Quaternion(0,0,0,1);
        var pitchQuat = new THREE.Quaternion(0,0,0,1);
        var combinedQuat = new THREE.Quaternion(0,0,0,1);

        yawQuat.setFromAxisAngle( camera.up, -movementX * YAW_SPEED);
        pitchQuat.setFromAxisAngle( axis, -movementY * PITCH_SPEED);

        combinedQuat.multiplyQuaternions(yawQuat, pitchQuat);

        // Apply rotation to camera's direction vector
        var direction = new THREE.Vector3(0,0,0);
        direction.subVectors(camera.lookAtVector, camera.position);
        direction.normalize();
        direction.applyQuaternion(combinedQuat);

        // Create new LookAt point
        var newLookAt = new THREE.Vector3(0,0,0);
        newLookAt.addVectors(camera.position, direction);

        lookAtPoint = newLookAt;

        updateCamera();
    }

    function bodyMovement(dir){
        // t represents the direction to move towards to
        // t is normalized, so that deltaPosition has 'unitary' values
        var t = new THREE.Vector3(0, 0, 0);
        var d = new THREE.Vector3(0, 0, 0);

        t.crossVectors(camera.direction, camera.up);
        d.copy(camera.direction);
        t.normalize();
        d.normalize();

        if (moveForward) deltaPosition.add(d);
        if (moveBackward) deltaPosition.sub(d);
        if (moveLeft) deltaPosition.sub(t);
        if (moveRight) deltaPosition.add(t);

        updateCamera();
    }

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                // bodyMovement('up');
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                // bodyMovement('left');
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                // bodyMovement('down');
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                // bodyMovement('right');
                break;
            // case 32: // space
            //     if ( canJump === true ) velocity.y += 350;
            //     canJump = false;
            //     break;
        }

        bodyMovement();
    };

    var onKeyUp = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
    
    return function(x, y){
        var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

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
        
        prevTime = performance.now();

        // init camera
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = distanceToFloor !== undefined ? camera.position.z + HEIGHT - distanceToFloor : HEIGHT;

        // Looking north
        lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE_TO_LOOK_AT, camera.position.z )
        camera.lookAt( lookAtPoint );

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        document.body.addEventListener("mousemove", headMovement, false);

        return function desactivate(){

            document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;
            document.exitPointerLock();

            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            document.body.removeEventListener("mousemove", headMovement, false);
            document.exitPointerLock();

        };
    }
    
};