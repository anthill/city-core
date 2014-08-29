'use strict';

var THREE = require('three');

module.exports = function(camera, scene, domElement){

	var ray = new THREE.Raycaster(),
	    projector = new THREE.Projector();

	var mouse = {
		x: 0,
		y: 0
	};

	var old;

	function onClick(event){
	    
		// Get the mouse X and Y screen positions, and scale them to [-1, 1] ranges, position (-1, 1) being the upper left side of the screen.
	    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	    
	    // Create Vector3 from mouse position, with Z = 0
	    var mousePos = new THREE.Vector3(mouse.x, mouse.y, 0);

	    // Create a picking-specific RayCaster from Three.js library 
	    ray = projector.pickingRay(mousePos, camera);

	    // Get the list of all scene children intersected by Raycaster
	    var out = ray.intersectObjects(scene.children, false);

	    if (old)
	    {
	    	// Unselect the previous building
	    	old.material.color.setHex(0xaaaaaa);
	    }
		if (out.length != 0)
	    {
	        
	        var newEvent = new CustomEvent('meshClicked', {
	        	detail:{
	        		'mesh': out[0].object,
	        		'point': out[0].point 
	        	}
	        });
	        window.dispatchEvent(newEvent);

	        // Color/uncolor the selected/unselected building
	        /*if (old == out[0].object)
	        	out[0].object.material.color.setHex(0xaaaaaa);
	        else
	        	out[0].object.material.color.setHex(0xff0000);*/

	        old = out[0].object;

	        //var data = wm.get(out[0])
	        //camera.lookAt(new THREE.Vector3( out[0].point.x, out[0].point.y, out[0].point.z ));
	    }
	}

	domElement.addEventListener( 'click', onClick );
	
}