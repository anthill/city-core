'use strict';

var THREE = require('three');

module.exports = function(camera){

    // add controls
    var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, ROTATE: 65, ZOOM: 83, PAN: 68 };
    var userPanSpeed = 50.0;
    function pan ( distance ) {
        var camx = camera.position.x + distance.x*userPanSpeed;
        var camy = camera.position.y + distance.y*userPanSpeed;
        camera.position.x = camx;
        camera.position.y = camy;
        
        camera.lookAtVector = new THREE.Vector3( camx, camy, 0 );
    };

    function onKeyDown( event ) {
        event.preventDefault();
        switch ( event.keyCode ) {
            case keys.UP:
                pan( new THREE.Vector3( 0, 1, 0 ) );
                break;
            case keys.BOTTOM:
                pan( new THREE.Vector3( 0, - 1, 0 ) );
                break;
            case keys.LEFT:
                pan( new THREE.Vector3( - 1, 0, 0 ) );
                break;
            case keys.RIGHT:
                pan( new THREE.Vector3( 1, 0, 0 ) );
                break;
        }
    }

    window.addEventListener( 'keydown', onKeyDown );
}

