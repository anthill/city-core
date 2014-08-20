'use strict';

var THREE = require('three');
var MAXY = require('./MAX_Y');

// useful functions
// we'll transform x,y ranging from -nbx to nbx in 4096 int values
var nbx = 150;
function transform(x) {
    return 2*x*nbx/4095-nbx;
}

var nbz1 = -75;
var nbz2 = 115;
// we'll transform z ranging from nbz1 to nbz2 in 255 int values
function transformZ(z) {
    return (z - 255)*(nbz2-nbz1)/255 +nbz2;
}

/*
    Parses a buffer with binary data describing an object to be added to the scene
    
    data is a DataView
    @returns a THREE.Mesh
*/
module.exports = function createBuildingMesh(buffer, X, Y) {

    var geometry = new THREE.Geometry();
    var offset = 0;

    var verticesNb = buffer.getUint16(offset);
    offset += 2;

    for(var i = 0 ; i < verticesNb ; i++){

        var b1 = buffer.getUint8(offset);
        offset++;
        var b2 = buffer.getUint8(offset);
        offset++;
        var b3 = buffer.getUint8(offset);
        offset++;

        var x = transform(((b1 & 0xFF) << 4) + ((b2 & 0xF0) >> 4));
        var y = transform(((b2 & 0x0F) << 8) + ((b3 & 0xFF) >> 0));

        var z = transformZ( buffer.getUint8(offset) );
        offset++;

        // decompress en x, y, z
        geometry.vertices.push(new THREE.Vector3(x, y, z));
    }


    var facesNb = buffer.getUint16(offset);
    offset += 2;

    var faces = [];
    for(var i = 0 ; i < facesNb ; i++){
        var a = buffer.getUint16(offset);
        offset += 2;
        var b = buffer.getUint16(offset);
        offset += 2;
        var c = buffer.getUint16(offset);
        offset += 2;
        geometry.faces.push(new THREE.Face3(a, b, c));
    }

    geometry.computeFaceNormals();
    
    var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        color: 0xaaaaaa,
        wireframe: false
    }));
    
    mesh.position.set(X*200, (MAXY - Y)*200, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
}
