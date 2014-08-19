'use strict';

module.exports = function(camera){

    // add controls
    var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, ROTATE: 65, ZOOM: 83, PAN: 68 };
    var userPanSpeed = 200.0;
    function pan ( distance ) {
        var camx = camera.position.x + distance.x*userPanSpeed;
        var camy = camera.position.y + distance.y*userPanSpeed;
        moveCamera(camx, camy, camz);
    };

    function onKeyDown( event ) {
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

    function onKeyUp( event ) {

        switch ( event.keyCode ) {

            case keys.ROTATE:
            case keys.ZOOM:
            case keys.PAN:
                state = STATE.NONE;
                break;
        }

    }
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
}

