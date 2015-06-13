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

/* order of argument is important as it decides the normal direction */
function triangleSignedVolume(a, b, c){
    var vcba = c.x * b.y * a.z;
    var vbca = b.x * c.y * a.z;
    var vcab = c.x * a.y * b.z;
    var vacb = a.x * c.y * b.z;
    var vbac = b.x * a.y * c.z;
    var vabc = a.x * b.y * c.z;
    return (-vcba + vbca + vcab - vacb - vbac + vabc)/6;
}

module.exports = function(mesh){
    var vertices = mesh.vertices;
    
    return mesh.faces.reduce(function(sum, face){
        return sum + triangleSignedVolume( vertices[face.a], vertices[face.b], vertices[face.c]);
    }, 0);
};