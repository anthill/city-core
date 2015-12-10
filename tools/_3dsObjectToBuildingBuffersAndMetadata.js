"use strict";

var Map = require('es6-map');

var containingCube = require('./containingCube.js');
var computeMeshVolume = require('./computeMeshVolume.js');
var _3dsFormatToAntsBinaryBuffer = require('./3dsFormatToAntsBinaryBuffer.js');

// name => next nb to use to append to the name to make it unique
var ids = new Map();


// in : one archive
// out : a bunch of binaries + metadata
module.exports = function(data, x, y, deltaZ){

    var objects = data.getObjects();
    var meshes = objects.map(function(o){
        // Generate unique ids since the data producers may fail to do so
        var id;
        if(!ids.has(o.name)){
            id = o.name;
            ids.set(o.name, 1);
        }
        else{
            var nb = ids.get(o.name);
            id = o.name + '-' + nb;
            while(ids.has(id)){
                nb++;
                id = o.name + '-' + nb;
            }
            ids.set(o.name, nb+1);
        }

        return {
            id: id,
            vertices: o.meshes.vertices,
            faces: o.meshes.faces
        };

    });

    /*
                Working around https://github.com/anthill/bordeaux3d/issues/11
            */
    // looking for xXXXyYYY object. There is only one per 3ds file
    var xyObject = meshes.filter(function(m){ return !!m.id.match(/x(\d{1,4})y(\d{1,4})/) })[0];
    var xyContainingCube = containingCube(xyObject);

    // Ideally, xyContainingCube.xmax and xyContainingCube.ymax should be +100. Finding the translation.
    var deltaX = 100 - xyContainingCube.maxX;
    var deltaY = 100 - xyContainingCube.maxY;

    // modify HERE to cancel the position fix

    if(deltaX !== 0 || deltaY !== 0){
        // apply translation to all tile objects
        meshes.forEach(function(m){
            m.vertices.forEach(function(v){
                v.x += deltaX;
                v.y += deltaY;
            });
        });
    }

    meshes.forEach(function(m){
        m.vertices.forEach(function(v){
            v.z += deltaZ;
        });
    });

    // Find tile bounding box
    var containingCubes = meshes.map(containingCube);
    // create a fake mesh based on the cubes descriptions
    var fakeCombiningMesh = {
        vertices: containingCubes.reduce(function(acc, cubeDesc){
            acc.push({
                x: cubeDesc.minX,
                y: cubeDesc.minY,
                z: cubeDesc.minZ,
            });
            acc.push({
                x: cubeDesc.maxX,
                y: cubeDesc.maxY,
                z: cubeDesc.maxZ,
            });

            return acc;
        }, [])
    };
    var tileContainingCube = containingCube(fakeCombiningMesh);

    var minZ = Math.floor(tileContainingCube.minZ);
    var maxZ = Math.ceil(tileContainingCube.maxZ);
    if(minZ === maxZ){ // happens for flat floor objects
        maxZ = minZ + 1;
    }

    // integer approximation
    var tileMetadata = {
        X: x,
        Y: y,
        minX: Math.floor(tileContainingCube.minX),
        maxX: Math.ceil(tileContainingCube.maxX),
        minY: Math.floor(tileContainingCube.minY),
        maxY: Math.ceil(tileContainingCube.maxY),
        minZ: minZ,
        maxZ: maxZ,
        objects: Object.create(null)
    };

    var buildingBuffers = Object.create(null);
    meshes.forEach(function(m, i){
        try{
            buildingBuffers[m.id] = _3dsFormatToAntsBinaryBuffer(m, tileMetadata);
        }
        catch(e){
            console.error('compacting error', x, y, e)
        }
    });

    meshes.forEach(function(m){
        // for recentering
        var objectCube = containingCube(m);

        tileMetadata.objects[m.id] = {
            x: Math.round( (objectCube.minX + objectCube.maxX)/2 ),
            y: Math.round( (objectCube.minY + objectCube.maxY)/2 ),
        };
    });

    return {
        buildingBuffers: buildingBuffers,
        tileMetadata : tileMetadata
    };

}