'use strict';
// 10804 11531 25725 23356
// Camera initially at 24541.22 11167.65 300
var THREE = require('three');


/*
    one click: focus on object and move around it
    remaining mouse down: move forward
    
    move mouse : move around object when one focused
                look around when no object is focused

*/

var cos = Math.cos,
    sin = Math.sin;

var DISTANCE = 20;

module.exports = function(camera, domElement){
    camera.up.set(0, 0, 1); // Looking up
    
    camera.position.x = 24541.22;
    camera.position.y = 11167.65;
    camera.position.z = 3;
    
    var lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y - DISTANCE, camera.position.z );
    
    camera.lookAt( lookAtPoint )
    
    var alpha;
    var animationFrame;
    var rotation = 0;
    
    function moveCamera(){
        
        console.log('rotation', rotation, lookAtPoint.x, lookAtPoint.y, camera.position);
        lookAtPoint.x = camera.position.x +
            ((lookAtPoint.x - camera.position.x)*cos(alpha) - (lookAtPoint.y - camera.position.y)*sin(alpha));
        lookAtPoint.y = camera.position.y +
            ((lookAtPoint.x - camera.position.x)*sin(alpha) + (lookAtPoint.y - camera.position.y)*cos(alpha));
        
        camera.lookAt( lookAtPoint );
        rotation += alpha;
        animationFrame = requestAnimationFrame(moveCamera)
    }
    
    domElement.addEventListener('mousemove', function(e){
        var canvasBoundingRect = domElement.getBoundingClientRect();
        
        var deltaX = e.clientX - canvasBoundingRect.width/2;
        
        if(Math.abs(deltaX) > canvasBoundingRect.width/10){
            alpha = Math.PI/400;
            if(deltaX > 0)
                alpha = -alpha;
            
            if(!animationFrame)
                animationFrame = requestAnimationFrame(moveCamera)
        }
        else{
            cancelAnimationFrame(animationFrame);
            animationFrame = undefined;
        }
        
    });
    
    var moveAnimationFrame;
    var SPEED = 0.1;
    
    domElement.addEventListener('mousedown', function(){
        var moveVector = {
            x : lookAtPoint.x - camera.position.x,
            y : lookAtPoint.y - camera.position.y,
        };
        
        moveAnimationFrame = requestAnimationFrame(function moveForward(){
            camera.position.x += SPEED*moveVector.x;
            lookAtPoint.x     += SPEED*moveVector.x;
            camera.position.y += SPEED*moveVector.y;
            lookAtPoint.y     += SPEED*moveVector.y;
            
            moveAnimationFrame = requestAnimationFrame(moveForward);
        })
        
    });
    
    domElement.addEventListener('mouseup', function(){
        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    });
    
};