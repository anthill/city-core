'use strict';

var THREE = require('three');

var createBuildingMesh = require('./createBuildingMesh');
var meshTypeToString = require('../common/meshType.js').intToString;
var meshFromId = require('./meshFromId.js');
var infosFromMesh = require('./infosFromMesh.js');
var meshDefaultColor = require('./meshDefaultColor.js')

module.exports = function (object, options){

	/* object: {
		id,
		buffer,
		metadata
	} */

	var buffer = object.buffer;
	var tile = object.metadata.tile;

	var typeBuffer = new DataView(buffer, 0, 2);
	var meshBuffer = new DataView(buffer, 2);

	var type = meshTypeToString[typeBuffer.getUint8(0)];
	var mesh = createBuildingMesh(meshBuffer, tile, options);

	mesh.material.color.setHex(meshDefaultColor[type]);

	if (type === 'building')
		mesh.castShadow = true;
	else
		mesh.receiveShadow = true;

	// fill infosFromMesh and meshFromId
    infosFromMesh.set(mesh, {
        id: object.id,
        metadata: object.metadata,
        type: type,
    });
    meshFromId.set(object.id, mesh);


	return mesh;
}