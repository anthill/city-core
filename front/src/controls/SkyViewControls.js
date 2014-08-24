'use strict';

/*
    * Keys up/down/right/left: move camera
    * Scroll up/down: zoom in/out
    
    * Click: center view on building
*/

var THREE = require('three');

module.exports = function(camera, domElement){
    
    var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
    var userPanSpeed = 50.0;

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

        camera.lookAt( new THREE.Vector3( x, y, 0 ) );
        // looking North (y=1)
        
        window.addEventListener( 'keydown', onKeyDown );
        window.addEventListener( 'wheel', onScroll );

        return function desactivate(){
            // In Chrome listening to keypress doesn't work for whatever reason
            window.removeEventListener( 'keydown', onKeyDown );
            window.removeEventListener( 'wheel', onScroll );
        };
    }
    
    
};