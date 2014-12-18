'use strict';

/*
    * Keys up/down/right/left: move camera
    * Mouse Move: move camera too
    * Scroll up/down: zoom in/out
    
    * Click: center view on building
*/

var THREE = require('three');

module.exports = function(camera, domElement){
    
    var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
    var userPanSpeed = 50.0;

    var alpha;
    var beta;
    var moveAnimationFrame;

    function pan ( direction ) {
        var camx = camera.position.x + direction.x*userPanSpeed;
        var camy = camera.position.y + direction.y*userPanSpeed;
        camera.position.x = camx;
        camera.position.y = camy;

        camera.lookAt( new THREE.Vector3( camx, camy, 0 ) );
    };

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

    function sign(x) {
        return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
    }

    function moveCamera(){
        camera.position.x = camera.position.x + alpha;
        camera.position.y = camera.position.y + beta;
        // console.log("beta", beta, "alpha", alpha, "newz", newz)

        moveAnimationFrame = requestAnimationFrame(moveCamera);
    }
    
    function mouseMoveListener(e){

        var canvasBoundingRect = domElement.getBoundingClientRect();

        var deltaX = e.clientX - canvasBoundingRect.width/2;
        var deltaZ = e.clientY - canvasBoundingRect.height/2;

        var thresX = canvasBoundingRect.width*3/10;
        var normX = canvasBoundingRect.width/2 - canvasBoundingRect.width*3/10;
        var thresZ = canvasBoundingRect.height*3/10;
        var normZ = canvasBoundingRect.height/2 - canvasBoundingRect.height*3/10;

        if(Math.abs(deltaX) > thresX || Math.abs(deltaZ) > thresZ){

            if (Math.abs(deltaX) > thresX){
                alpha = (Math.abs(deltaX)-thresX)*(Math.abs(deltaX)-thresX) / (normX*normX) * sign(deltaX) * camera.position.z/15;
            //     alpha = MAX_HORI_SPEED *
            //         (Math.abs(deltaX) - canvasBoundingRect.width/10)/
            //         (canvasBoundingRect.width/2 - canvasBoundingRect.width/10);
            //     if(deltaX > 0)
            //         alpha = -alpha;
            }
            else {alpha = 0;}

            if (Math.abs(deltaZ) > thresZ){
                beta = - (Math.abs(deltaZ)-thresZ)*(Math.abs(deltaZ)-thresZ) / (normZ*normZ) * sign(deltaZ) * camera.position.z/15;
            //     beta = MAX_VERTI_SPEED *
            //         (Math.abs(deltaZ) - canvasBoundingRect.height/20)/
            //         (canvasBoundingRect.height/2 - canvasBoundingRect.height/20);
            //     if(deltaZ > 0)
            //         beta = -beta;
            }
            else {beta = 0;}

            if(!moveAnimationFrame)
                moveAnimationFrame = requestAnimationFrame(moveCamera)
        }

        // moveCamera();
        else{
            cancelAnimationFrame(moveAnimationFrame);
            moveAnimationFrame = undefined;
        }
    }

    var ZOOM_BY_DELTA = 25;
    
    // hack to normalize deltaY values across browsers.
    var minDeltaY;
    function onScroll(e){
        if (minDeltaY > Math.abs(e.deltaY) || !minDeltaY) {
          minDeltaY = Math.abs(e.deltaY);
        }
        
        var deltaY = e.deltaY/minDeltaY;
        
        e.preventDefault();
        camera.position.z += deltaY*ZOOM_BY_DELTA;
        // TODO send a ray in mouse direction and move camera.position.x/y in this direction
    }
    
    
    return function(x, y, altitude){
        camera.near = 1;
        camera.far = 5000;
        
        camera.up = new THREE.Vector3(0, 1, 0);
        
        camera.position.x = x; // 24541.22;
        camera.position.y = y; // 11167.65;
        camera.position.z = altitude; // 3;

        console.log("cameraZ: " + camera.position.z);

        camera.lookAt( new THREE.Vector3( x, y, 0 ) );
        // looking North (y=1)
        
        window.addEventListener( 'keydown', onKeyDown );
        window.addEventListener( 'wheel', onScroll );
        window.addEventListener( 'mousemove', mouseMoveListener );

        return function desactivate(){
            // In Chrome listening to keypress doesn't work for whatever reason
            window.removeEventListener( 'keydown', onKeyDown );
            window.removeEventListener( 'wheel', onScroll );
            window.removeEventListener( 'mousemove', mouseMoveListener );
            cancelAnimationFrame(moveAnimationFrame);
            moveAnimationFrame = undefined;
        };
    }    
};