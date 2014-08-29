'use strict';

function xTo12bitsInt(x, MIN_X, MAX_X){
    if(x < MIN_X || x > MAX_X)
        throw new RangeError( ['x should be between', MIN_X, 'and', MAX_X, '(',x.toFixed(2),')'].join(' ')  );
    
    return Math.round( (x - MIN_X) * ((1 << 12)-1) / (MAX_X - MIN_X));
}
function yTo12bitsInt(y, MIN_Y, MAX_Y){
    if(y < MIN_Y || y > MAX_Y)
        throw new RangeError( ['y should be between', MIN_Y, 'and', MAX_Y, '(',y.toFixed(2),')'].join(' ')  );
    
    return Math.round( (y - MIN_Y) * ((1 << 12)-1) / (MAX_Y - MIN_Y));
}                
function zTo8bitsInt(z, MIN_Z, MAX_Z){
    if(z < MIN_Z || z > MAX_Z)
        throw new RangeError( ['z should be between', MIN_Z, 'and', MAX_Z, '(',z.toFixed(2),')'].join(' ')  );
    
    return Math.round( (z - MIN_Z) * ((1 << 8)-1) / (MAX_Z - MIN_Z));
}


/*
    x, y, z: float
*/
function encodeVertex(x, y, z){
    return (xTo12bitsInt(x) << 20) + (yTo12bitsInt(y) << 8) + zTo8bitsInt(z);
}

/*
    _3dsObject is a {
        vertices: Vertex[],
        faces: Face[],
    }
    
    Vertex:{
        x, y, z // floats
    }
    Face : {
        a, b, c // indices in vertices array
    }
    

    returns a Buffer encoded as :
    
    object : | nbVertices(2) | v1(4) | v2(4) | ... | vn(4) | nbFaces(2) | f1(6) | f2(6) | ... | fn(6) |
    
    nbVertices : number of vertices uint16 (64k max)
    nbFaces : number of vertices uint16 (64k max)
    vi : | x(12 bits) | y(12 bits)| z(8 bits) |
    fi : | a(16 bits) | b(16 bits)| c(16 bits) | // indices in vertices array
    
    Number are encoded with big endianness
    
    boundingBox : {
        minX,
        maxX,
        
    }
*/
module.exports = function(_3dsObject, boundingBox){
    var nbVertices = _3dsObject.vertices.length;
    var nbFaces = _3dsObject.faces.length;
    
    if(nbVertices > ((1 << 2*8) - 1) || nbFaces > ((1 << 2*8) - 1))
        throw new RangeError(nbVertices + ', ' + nbFaces);

    var bufferSize = 2 + 4*nbVertices + 2 + (2*3)*nbFaces;
    
    //console.log('bufferSize', bufferSize)
    
    var buffer = new Buffer(bufferSize);
    var offset = 0;
    
    buffer.writeUInt16BE(nbVertices, offset);
    offset += 2;
    
    _3dsObject.vertices.forEach(function(v){
        //console.log(v.x, v.y, v.z, encodeVertex(v.x, v.y, v.z), offset);
        var xUint12 = xTo12bitsInt(v.x, boundingBox.minX, boundingBox.maxX);
        var yUint12 = yTo12bitsInt(v.y, boundingBox.minY, boundingBox.maxY);
        
        buffer.writeUInt8( ((xUint12 & 0xFF0) >> 4), offset );
        buffer.writeUInt8( ((xUint12 & 0x00F) << 4) + ((yUint12 & 0xF00) >> 8), offset+1);
        buffer.writeUInt8( ((yUint12 & 0x0FF) ), offset+2);
        try{
            buffer.writeUInt8( zTo8bitsInt(v.z, boundingBox.minZ, boundingBox.maxZ), offset+3);
        }
        catch(e){
            console.error(v.z, boundingBox.minZ, boundingBox.maxZ, zTo8bitsInt(v.z, boundingBox.minZ, boundingBox.maxZ))
            throw e;
        }
        
        offset += 4;
    });
    
    buffer.writeUInt16BE(nbFaces, offset);
    offset += 2;
    
    _3dsObject.faces.forEach(function(f){
        buffer.writeUInt16BE(f.a, offset);
        offset += 2;
        buffer.writeUInt16BE(f.b, offset);
        offset += 2;
        buffer.writeUInt16BE(f.c, offset);
        offset += 2;
    });
    
    return buffer;
    
};







