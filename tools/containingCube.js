'use strict';

/*
    Given a set of triangles, find the volume described by these triangles
*/

/*
    mesh {
        vertices: [
            {x, y, z} // floats
        ],
        faces: [
            { a, b, c } // indices in vertices array
        ]
    };
*/

module.exports = function(mesh){
    var vertices = mesh.vertices;
    
    var xs = vertices.map(function(v){return v.x});
    var ys = vertices.map(function(v){return v.y});
    var zs = vertices.map(function(v){return v.z});
    
    return {
        minX: Math.min.apply(undefined, xs),
        maxX: Math.max.apply(undefined, xs),
        minY: Math.min.apply(undefined, ys),
        maxY: Math.max.apply(undefined, ys),
        minZ: Math.min.apply(undefined, zs),
        maxZ: Math.max.apply(undefined, zs)
    };
};