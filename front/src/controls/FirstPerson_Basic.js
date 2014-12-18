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

var YAW_SPEED = 0.00005;
var PITCH_SPEED = 0.00005;

var DISTANCE_TO_LOOK_AT = 20;
// var MAX_HORI_SPEED = Math.PI/100;
// var MAX_VERTI_SPEED = Math.PI/120;

module.exports = function(camera, scene, domElement){
	
	var getFloorHeight = _getFloorHeight(scene);
	
	var alpha;
	var beta;
	var rotation = 0;
	
	var lookAtPoint;

	function mouseMoveListener(e){
		var canvasBoundingRect = domElement.getBoundingClientRect();

		var deltaX = e.clientX - canvasBoundingRect.width/2;
		var deltaZ = e.clientY - canvasBoundingRect.height/2;

		if(Math.abs(deltaX) > canvasBoundingRect.width/10 || Math.abs(deltaZ) > canvasBoundingRect.height/20){


			// Create pitch axis
			var axis = new THREE.Vector3();
			axis.crossVectors(camera.direction, camera.up);

			// Create quaternions for pitch and yaw, then combine them
			var yawQuat = new THREE.Quaternion(0,0,0,1);
			var pitchQuat = new THREE.Quaternion(0,0,0,1);
			var combinedQuat = new THREE.Quaternion(0,0,0,1);

			yawQuat.setFromAxisAngle( camera.up, -deltaX * YAW_SPEED);
			pitchQuat.setFromAxisAngle( axis, -deltaZ * PITCH_SPEED);

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

			// WARNING FROM FPS_PointerLock.js, not really applicable here since there is no updateCamera():
			// camera.lookAt() should be inside updateCamera() for later requestAnimationFrame optimization purpose.
			// But if so, the lookAt behaviour is odd... for now camera.lookAt() stays here.
			camera.lookAt(lookAtPoint);

		}

	}


	var moveAnimationFrame;
	var previousDistanceToFloor;
	var SPEED = 0.5;

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
			
			var rayCasterPosition = camera.position;
			rayCasterPosition.z = 10000;
			var distanceToFloor = getFloorHeight(rayCasterPosition);
			if(distanceToFloor !== undefined){
            camera.position.z += HEIGHT - distanceToFloor;
            if (previousDistanceToFloor !== undefined){
                var deltaHeight = distanceToFloor - previousDistanceToFloor;
                lookAtPoint.z -= deltaHeight;
            }
            previousDistanceToFloor = distanceToFloor;
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
		
		var rayCasterPosition = camera.position;
		rayCasterPosition.z = 10000;
		var distanceToFloor = getFloorHeight(rayCasterPosition);
		// console.log('distance to floor', distanceToFloor, camera.position.z + HEIGHT - distanceToFloor)
		
		// init camera
		camera.position.x = x;
		camera.position.y = y;
		camera.position.z = distanceToFloor !== undefined ? camera.position.z + HEIGHT - distanceToFloor : HEIGHT;

		// Looking north
		lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE_TO_LOOK_AT, camera.position.z )
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