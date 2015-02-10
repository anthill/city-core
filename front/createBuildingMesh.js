'use strict';

var THREE = require('three');
var MAXY = require('./MAX_Y');

function xFrom12bitsInt(x, MIN_X, MAX_X){
    return x*(MAX_X - MIN_X)/(((1 << 12)-1)) + MIN_X;
}
function yFrom12bitsInt(y, MIN_Y, MAX_Y){
    return y*(MAX_Y - MIN_Y)/(((1 << 12)-1)) + MIN_Y;
}                
function zFrom8bitsInt(z, MIN_Z, MAX_Z){
    return z*(MAX_Z - MIN_Z)/(((1 << 8)-1)) + MIN_Z;
}

/*
    Parses a buffer with binary data describing an object to be added to the scene

    buffer: | nbVertices(2) | v1(4) | v2(4) | ... | vn(4) | nbFaces(2) | f1(6) | f2(6) | ... | fn(6) | meshType(2)
    
    nbVertices : number of vertices uint16 (64k max)
    nbFaces : number of vertices uint16 (64k max)
    vi : | x(12 bits) | y(12 bits)| z(8 bits) |
    fi : | a(16 bits) | b(16 bits)| c(16 bits) | // indices in vertices array
    
    data is a DataView
    @returns a THREE.Mesh
*/
module.exports = function createBuildingMesh(buffer, tile, options) {

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

        var x = xFrom12bitsInt(((b1 & 0xFF) << 4) + ((b2 & 0xF0) >> 4), tile.minX, tile.maxX);
        var y = yFrom12bitsInt(((b2 & 0x0F) << 8) + ((b3 & 0xFF) >> 0), tile.minY, tile.maxY);

        var z = zFrom8bitsInt( buffer.getUint8(offset), tile.minZ, tile.maxZ);
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
        wireframe: false,
        shading: THREE.FlatShading
    }));

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.position.set(tile.X*200, (MAXY - tile.Y)*200, 0);
    
    return mesh;
}
