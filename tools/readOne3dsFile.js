'use strict';

var fs = require('fs');
var parse3ds = require('../src/parse3ds.js')


parse3ds('./data/buggyTiles/tile_x127y84.3ds', function(err, data){
    if(err) throw err;
    
    var objects = data.getObjects();
    
    /*
    return {
        id: o.name,
        vertices: o.meshes.vertices,
        faces: o.meshes.faces
    };
    
    */
    
    var brokenObj;
    var meshes = objects.forEach(function(o){
        if(o.name === '06345507'){
            brokenObj = o;
        }
    });
    
    
    console.log(brokenObj.ownData.length);
    
    console.log({
        id: brokenObj.name,
        vertices: brokenObj.meshes.vertices,
        faces: brokenObj.meshes.faces
    });
    
})