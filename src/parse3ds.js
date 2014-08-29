"use strict";

var fs = require("fs");

/* Sources:
    http://en.wikipedia.org/wiki/.3ds
    http://www.spacesimulator.net/wiki/index.php?title=Tutorials:3ds_Loader
    http://www.the-labs.com/Blender/3dsspec.html
*/

var chunkUtils = (function(){

    var chunkIds = {
        "Main": 0x4d4d,
        "M3D Version": 0x0002,
        "3D Editor Chunk": 0x3D3D,
        "Object Block": 0x4000,
        "Triangular Mesh": 0x4100,
        "Vertices List": 0x4110,
        "Faces Description": 0x4120,
        "Faces Material": 0x4130, 
        "Smoothing Group List": 0x4150,
        "Mapping Coordinates List": 0x4140,
        "Local Coordinates System": 0x4160,
        "Light": 0x4600,
        "Spotlight": 0x4610,
        "Camera": 0x4700,
        "Material Block": 0xAFFF
    };

    var children = {
        "Main" : [
            chunkIds["M3D Version"],
            chunkIds["3D Editor Chunk"]
        ],
        "3D Editor Chunk" : [
            chunkIds["Object Block"],
            chunkIds["Material Block"]
        ],
        "Object Block" : [
            chunkIds["Triangular Mesh"],
            chunkIds["Light"],
            chunkIds["Camera"]
        ],
        "Triangular Mesh" : [
            chunkIds["Vertices List"],
            chunkIds["Faces Description"],
            chunkIds["Mapping Coordinates List"],
            chunkIds["Local Coordinates System"]
        ],
        "Faces Description": [
            chunkIds["Faces Material"],
            chunkIds["Smoothing Group List"]
        ]
    };
    /*
    0x4D4D // Main Chunk
    ├─ 0x0002 // M3D Version
    ├─ 0x3D3D // 3D Editor Chunk
    │  ├─ 0x4000 // Object Block
    │  │  ├─ 0x4100 // Triangular Mesh
    │  │  │  ├─ 0x4110 // Vertices List
    │  │  │  ├─ 0x4120 // Faces Description
    │  │  │  │  ├─ 0x4130 // Faces Material
    │  │  │  │  └─ 0x4150 // Smoothing Group List
    │  │  │  ├─ 0x4140 // Mapping Coordinates List
    │  │  │  └─ 0x4160 // Local Coordinates System
    │  │  ├─ 0x4600 // Light
    │  │  │  └─ 0x4610 // Spotlight
    │  │  └─ 0x4700 // Camera
    │  └─ 0xAFFF // Material Block
    │     ├─ 0xA000 // Material Name
    │     ├─ 0xA010 // Ambient Color
    │     ├─ 0xA020 // Diffuse Color
    │     ├─ 0xA030 // Specular Color
    │     ├─ 0xA200 // Texture Map 1
    │     ├─ 0xA230 // Bump Map
    │     └─ 0xA220 // Reflection Map
    │        │  // Sub Chunks For Each Map 
    │        ├─ 0xA300 // Mapping Filename
    │        └─ 0xA351 // Mapping Parameters
    └─ 0xB000 // Keyframer Chunk
       ├─ 0xB002 // Mesh Information Block
       ├─ 0xB007 // Spot Light Information Block
       └─ 0xB008 // Frames (Start and End)
          ├─ 0xB010 // Object Name
          ├─ 0xB013 // Object Pivot Point
          ├─ 0xB020 // Position Track
          ├─ 0xB021 // Rotation Track
          ├─ 0xB022 // Scale Track
          └─ 0xB030 // Hierarchy Position
    */

    var chunkNameById = {};
    Object.keys(chunkIds).forEach(function(name){
        var value = chunkIds[name];
        chunkNameById[value] = name;
    });

    return {
        getChunkName: function(id){
            return chunkNameById[id];
        },
        getPotentialChildrenIds: function(name){
            return children[name] || [];
        },
        getChunkId: function(name){
            return chunkIds[name];
        }
    }

})();






//console.log(chunkNameById);

// buff only contains the content (length and type have been stripped out)
function Chunk(buff, type){
    //if(type === "Vertices List")
    //  console.log('Creating Vertices List chunk', buff.length)

    var children = [];

    var childTypeValue, childType;
    var childLength;

    var childrenIds = chunkUtils.getPotentialChildrenIds(type);

    // search for own data
    var ownDataLength = 0;    
    var cursor = 0;

    if(type === "Vertices List" || type === "Faces Description" || type === "Mapping Coordinates List"){
        if(type === "Vertices List"){
            var verticesNumber = buff.readUInt16LE(cursor);   
            ownDataLength = 2 + (3*4)*verticesNumber;
        }
        if(type === "Faces Description"){
            var facesNumber = buff.readUInt16LE(cursor);   
            ownDataLength = 2 + (3*2+2)*facesNumber;
        }
        if(type === "Mapping Coordinates List"){
            var uvsNumber = buff.readUInt16LE(cursor);   
            ownDataLength = 2 + (2*4)*uvsNumber;
        }
        
        cursor = ownDataLength;
    }
    else{
        while(cursor < buff.length - 2){
            childTypeValue = buff.readUInt16LE(cursor);
            if(childrenIds.indexOf(childTypeValue) !== -1)
                break;
            cursor += 1;
        }

        ownDataLength = cursor < buff.length - 2 ? cursor : buff.length;
    }

    if(ownDataLength > buff.length)
        throw new RangeError();

    // look for children
    while(cursor < buff.length -2){
        childTypeValue = buff.readUInt16LE(cursor);
        // beginning of a child
        childType = chunkUtils.getChunkName(childTypeValue);
        childLength = buff.readUInt32LE(cursor+2);

        if(childrenIds.indexOf(childTypeValue) !== -1){
            //if(type === "Triangular Mesh")
            //  console.log(type, 'creating child chunk of length from',  cursor + 6, 'to', cursor + childLength)
            children.push(Chunk(buff.slice(cursor + 6, cursor + childLength), childType));
        }
        else{
            //console.warn('skipping', childTypeValue, childLength);
        }
        cursor += childLength;
    }

    var ret = {
        get type(){
            return type;
        },
        get ownData(){
            return buff.slice(0, ownDataLength);
        },
        children : children,

        toString: function(indent){
            indent = indent || 0;

            var spaces = '';
            for(var i = 0; i < indent ; i++)
                spaces += ' ';

            return spaces + this.type + ' ' + (ownDataLength) + ' ' + (buff.length) + '\n' +
                this.children.map(function(chunk){ return chunk.toString(indent+2); }).join('');
        }
    };

    // TODO make mixins for these and move this code away
    if(type === "Object Block"){
        Object.defineProperty(ret, "meshes", {
            get: function(){
                return this.children.filter(function(c){
                    return c.type === "Triangular Mesh";
                })[0]; // singleton
            }
        });
        Object.defineProperty(ret, "name", {
            get: function(){
                var ownData = this.ownData
                return ownData.toString('utf-8', 0, ownData.length -1);
            }
        });
    }
    if(type === "Triangular Mesh"){
        Object.defineProperty(ret, "vertices", {
            get: function(){
                return this.children.filter(function(c){
                    return c.type === "Vertices List";
                })[0].vertices; // singleton
            }
        });
        Object.defineProperty(ret, "faces", {
            get: function(){
                return this.children.filter(function(c){
                    return c.type === "Faces Description";
                })[0].faces; // singleton
            }
        });
        Object.defineProperty(ret, "uvs", {
            get: function(){
                return this.children.filter(function(c){
                    return c.type === "Mapping Coordinates List";
                })[0].uvs; // singleton
            }
        });
    }
    if(type === "Vertices List"){
        Object.defineProperty(ret, "vertices", {
            get: function(){
                var data = this.ownData;

                var cursor = 0;

                var verticesNumber = data.readUInt16LE(cursor);
                cursor += 2;

                //console.log(verticesNumber);
                var vertices = [];

                while(verticesNumber > 0){
                    vertices.push({
                        x: data.readFloatLE(cursor),
                        y: data.readFloatLE(cursor+4),
                        z: data.readFloatLE(cursor+8)
                    });

                    cursor += 12;
                    verticesNumber--;
                }

                return vertices;
            }
        });
    }

    if(type === "Faces Description"){
        Object.defineProperty(ret, "faces", {
            get: function(){
                var data = this.ownData;

                var cursor = 0;

                var facesNumber = data.readUInt16LE(cursor);
                cursor += 2;

                var faces = [];
                var flags;

                while(facesNumber > 0){
                    faces.push({
                        a: data.readUInt16LE(cursor),
                        b: data.readUInt16LE(cursor+2),
                        c: data.readUInt16LE(cursor+4)
                    });

                    // pasing flags, but not using them.
                    flags = data.readUInt16LE(cursor+6);

                    cursor += 8;
                    facesNumber--;
                }

                return faces;
            }
        });
    }

    if(type === "Mapping Coordinates List"){
        Object.defineProperty(ret, "uvs", {
            get: function(){
                var data = this.ownData;

                var cursor = 0;

                var uvsNumber = data.readUInt16LE(cursor);
                cursor += 2;

                var uvs = [];

                while(uvsNumber > 0){
                    uvs.push({
                        a: data.readFloatLE(cursor),
                        b: data.readFloatLE(cursor+4)
                    });


                    cursor += 8;
                    uvsNumber--;
                }

                return uvs;
            }
        });
    }

    return ret;
}

function Parsed3DSFile(buff){

    var typeValue = buff.readUInt16LE(0);
    var type = chunkUtils.getChunkName(typeValue);
    if(type !== "Main"){
        throw new Error('First chunk should be "Main". It is '+type+' (0x'+typeValue.toString(16)+')')
    }
    var length = buff.readUInt32LE(2);

    return {
        "Main": Chunk(buff.slice(6, length), type),

        toString: function(){
            return this["Main"].toString();
        },
        getObjects: function(){
            var editorChunk = this["Main"].children[1];
            if(editorChunk.type !== "3D Editor Chunk")
                throw new Error();

            return editorChunk.children.filter(function(c){
                return c.type === "Object Block"
            })

        }
    }
}

module.exports = function(filename, cb){
    fs.readFile(filename, function(err, buff){
        if(err){
            cb(err);
            return;
        }

        cb(null, new Parsed3DSFile(buff))
    });
};
