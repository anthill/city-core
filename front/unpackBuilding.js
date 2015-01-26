'use strict';

var THREE = require('three');

var createBuildingMesh = require('./createBuildingMesh');
var meshTypeToString = require('../common/meshType.js').intToString;

var meshColor = {
    'floor': 0x8d7a63, // maroon
    'building': 0xd4cfb0 // sand
};

module.exports = function (buffer, tile, options){

	var typeBuffer = new DataView(buffer, 0, 2);
	var meshBuffer = new DataView(buffer, 2);

	var type = meshTypeToString[typeBuffer.getUint8(offset)];
	var mesh = createBuildingMesh(meshBuffer, tile, options);

	mesh.material.color.setHex(meshColor[type]);

	return {
		type: type,
		mesh: mesh
	};
}