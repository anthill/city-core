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
        xmin: Math.min.apply(undefined, xs),
        xmax: Math.max.apply(undefined, xs),
        ymin: Math.min.apply(undefined, ys),
        ymax: Math.max.apply(undefined, ys),
        zmin: Math.min.apply(undefined, zs),
        zmax: Math.max.apply(undefined, zs)
    };
};