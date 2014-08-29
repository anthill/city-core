'use strict';

/*
    * Move mouse: look around
    * Mouse down: move forward
    * Mouse up: stop moving forward
*/

var THREE = require('three');
var _getFloorHeight = require('../distanceToFloor.js');

var cos = Math.cos,
    sin = Math.sin;

var HEIGHT = 4;

var DISTANCE = 20;
var MAX_X_SPEED = Math.PI/120;

module.exports = function(camera, scene, domElement){
    
    var getFloorHeight = _getFloorHeight(scene);
    
    var alpha;
    var animationFrame;
    var rotation = 0;
    
    var lookAtPoint;
    
    function moveCamera(){
        lookAtPoint.x = camera.position.x +
            ((lookAtPoint.x - camera.position.x)*cos(alpha) - (lookAtPoint.y - camera.position.y)*sin(alpha));
        lookAtPoint.y = camera.position.y +
            ((lookAtPoint.x - camera.position.x)*sin(alpha) + (lookAtPoint.y - camera.position.y)*cos(alpha));

        camera.lookAt( lookAtPoint );
        rotation += alpha;
        animationFrame = requestAnimationFrame(moveCamera)
    }

    function mouseMoveListener(e){
        var canvasBoundingRect = domElement.getBoundingClientRect();

        var deltaX = e.clientX - canvasBoundingRect.width/2;

        if(Math.abs(deltaX) > canvasBoundingRect.width/10){
            alpha = MAX_X_SPEED*
                (Math.abs(deltaX) - canvasBoundingRect.width/10)/
                (canvasBoundingRect.width/2 - canvasBoundingRect.width/10);
            if(deltaX > 0)
                alpha = -alpha;

            if(!animationFrame)
                animationFrame = requestAnimationFrame(moveCamera)
        }
        else{
            cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }
    }


    var moveAnimationFrame;
    var SPEED = 0.1;

    function mouseDownListener(){

        moveAnimationFrame = requestAnimationFrame(function moveForward(){

            var moveVector = {
                x : lookAtPoint.x - camera.position.x,
                y : lookAtPoint.y - camera.position.y,
            };
            camera.position.x += SPEED*moveVector.x;
            lookAtPoint.x     += SPEED*moveVector.x;
            camera.position.y += SPEED*moveVector.y;
            lookAtPoint.y     += SPEED*moveVector.y;
            
            var distanceToFloor = getFloorHeight(camera.position);
            if(distanceToFloor !== undefined){
                camera.position.z += HEIGHT - distanceToFloor;
            }
            
            moveAnimationFrame = requestAnimationFrame(moveForward);
        });
        
        
    }

    function mouseUpListener(){
        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    }
    
    
    return function(x, y){
        camera.up = new THREE.Vector3(0, 0, 1);
        camera.near = 1;
        camera.far = 50;
        
        var distanceToFloor = getFloorHeight(camera.position);
        console.log('distance to floor', distanceToFloor, camera.position.z + HEIGHT - distanceToFloor)
        
        // init camera
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = distanceToFloor !== undefined ? camera.position.z + HEIGHT - distanceToFloor : HEIGHT;

        // Looking north
        lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE, camera.position.z )
        camera.lookAt( lookAtPoint );

        domElement.addEventListener('mousemove', mouseMoveListener);
        domElement.addEventListener('mousedown', mouseDownListener);
        domElement.addEventListener('mouseup', mouseUpListener);

        return function desactivate(){
            domElement.removeEventListener('mousemove', mouseMoveListener);
            domElement.removeEventListener('mousedown', mouseDownListener);
            domElement.removeEventListener('mouseup', mouseUpListener);
            cancelAnimationFrame(moveAnimationFrame);
            moveAnimationFrame = undefined;
        };
    }
    
};