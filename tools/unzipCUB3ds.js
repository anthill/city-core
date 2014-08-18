"use strict";

var path = require('path');
//var fs = require('fs');
var fs = require('graceful-fs');

var program = require('commander');
var unzip = require('unzip');
var tmp = require('tmp');
var Q = require('q');

var containingCube = require('../src/containingCube.js');
var computeMeshVolume = require('../src/computeMeshVolume.js');
var _3dsFormatToAntsBinaryBuffer = require('../src/3dsFormatToAntsBinaryBuffer.js');
var parse3ds = require('../src/parse3ds.js');


function tmpdir(){
    var def = Q.defer();

    tmp.dir(function(err, dir){
        if(err)
            def.reject(err);
        else
            def.resolve(dir);
    });

    return def.promise;
}
var readdir = Q.nfbind(fs.readdir);
var readFile = Q.nfbind(fs.readFile);
var writeFile = Q.nfbind(fs.writeFile);
var lstat = Q.nfbind(fs.lstat);


/*
    Takes an Array<T> and a function(x: T) => Promise<U>
    Processes each array element in sequence.
*/
function allInSequence(arr, f){
    if(arr.length === 0){
        var def = Q.defer();
        def.resolve([]);
        return def.promise;
    }
    
    if(arr.length === 1){
        return f(arr[0]).then(function(res){
            return [res];
        })
    }
    else{
        var first = arr[0];
        var tail = arr.slice(1);
        
        return f(first).then(function(res){
            return allInSequence(tail, f).then(function(tailRes){
                tailRes.push(res);
                return tailRes;
            });
        });   
    }
}



program
    .version('0.0.1')
    .option('--zip [path]', 'path to zip file')
    .option('--out [path]', 'output directory')
    .parse(process.argv);

if(!program.zip || !program.out)
    throw new Error('--zip and --out parameters are compulsory');

var zipAbsolutePath = path.resolve(process.cwd(), program.zip);
var outAbsolutePath = path.resolve(process.cwd(), program.out);

console.log(zipAbsolutePath, outAbsolutePath);


// in : one archive
// out : a bunch of binaries + metadata

function extractBuildings(_3dsPath, x, y){
    var def = Q.defer();
    parse3ds(_3dsPath, function(err, data){
        if(err){
            def.reject(err);
            return;
        }

        var objects = data.getObjects();
        var meshes = objects.map(function(o){
            try{ // sometimes o.meshes.faces fails because of an apparently misformed file.
                return {
                    id: o.name,
                    vertices: o.meshes.vertices,
                    faces: o.meshes.faces
                };
            }
            catch(e){
                console.log('Error with object', o.name, 'skipping.', e);
                return {
                    id: o.name,
                    vertices: [],
                    faces: [],
                    error: String(e)
                };
            }
        });
        
        /*
            Working around https://github.com/anthill/bordeaux3d/issues/11
        */
        // looking for xXXXyYYY object. There is only one per 3ds file
        var xyObject = meshes.filter(function(m){ return !!m.id.match(/x(\d{1,4})y(\d{1,4})/) })[0]; 
        var xyContainingCube = containingCube(xyObject);
        
        // xyContainingCube.xmax and xyContainingCube.ymax should be +100. Finding the translation.
        var deltaX = 100 - xyContainingCube.xmax;
        var deltaY = 100 - xyContainingCube.ymax;
        
        if(deltaX !== 0 || deltaY !== 0){
            // apply translation to all tile objects
            meshes.forEach(function(m){
                m.vertices.forEach(function(v){
                    v.x += deltaX;
                    v.y += deltaY;
                });
            });
        }
        
        var buildingBuffers = Object.create(null);
        meshes.forEach(function(m, i){
            buildingBuffers[m.id] = _3dsFormatToAntsBinaryBuffer(m);
        });

        var metadata = Object.create(null);
        meshes.forEach(function(m){
            var tilePosition = containingCube(m);

            metadata[m.id] = {
                X: x,
                Y: y,
                xmin: tilePosition.xmin,
                xmax: tilePosition.xmax,
                ymin: tilePosition.ymin,
                ymax: tilePosition.ymax,
                zmin: tilePosition.zmin,
                zmax: tilePosition.zmax,
                volume: computeMeshVolume(m)
            };
        });

        def.resolve({
            buildingBuffers: buildingBuffers,
            metadata :metadata
        })

    });

    return def.promise;
}


function unzipInTmpDir(pathToZip){
    var readStream = fs.createReadStream(pathToZip);

    return tmpdir().then(function(tmpDir){
        var def = Q.defer();

        var extractWriteStream = unzip.Extract({ path: tmpDir })
        readStream.pipe(extractWriteStream);
        
        extractWriteStream.on('close', function(e){ // 'close' event, unlike 'finish' guarantees all writes to disk are finished
            //console.log('close');
            def.resolve(tmpDir);
        });

        return def.promise;
    });
}


/*
    Process the directory of a single selection
*/
function processSelectionDirectory(selectionZipDirPath){
    //console.log('processSelectionDirectory', selectionZipDirPath);
    
    var matches = selectionZipDirPath.match(/\/?([^\/]+)\.zip/); 
    var selectionName = matches[1]; // assumed 2 letters like "RL"

    return unzipInTmpDir(selectionZipDirPath)
        .then(function(selectionDir){
            //console.log('unzipped', selectionName, selectionDir);
            
            var selectionPath = path.join(selectionDir, selectionName);
            return readdir(selectionPath)
                .then(function(selectionFiles){
                    //selectionFiles = selectionFiles.slice(0, 4);

                    //console.log("selectionFiles", selectionFiles);
                    
                    var tile3dsPathsAndxy = selectionFiles
                        .filter(function(f){
                            return f.indexOf('.') === -1; // weak test
                        })
                        .map(function(f){
                            var matches = f.match(/x(\d{1,4})y(\d{1,4})/);

                            return {
                                x: parseInt(matches[1]),
                                y: parseInt(matches[2]),
                                path: path.join(selectionPath, f, f +'.3ds')
                            };
                        });
                    //console.log(name, tile3dsPaths);

                    return Q.all(tile3dsPathsAndxy.map(function(tpxy){
                        var tile3dsPath = tpxy.path;
                        var x = tpxy.x;
                        var y = tpxy.y;

                        return extractBuildings(tile3dsPath, x, y).then(function(res){
                            var buildingBuffers = res.buildingBuffers;
                            var metadata = res.metadata;

                            return Q.all(Object.keys(buildingBuffers).map(function(id){
                                var buildingOutPath = path.join(outAbsolutePath, id);
                                return writeFile(buildingOutPath, buildingBuffers[id]);
                            })).then(function(){
                                // metadata is returned when all building binary files have been written
                                return metadata;
                            });

                        }).fail(function(err){
                            console.error('extractBuildings error', selectionName, x, y, tile3dsPath, err);
                        });
                    }));
                });
        });



}


console.time('all');
console.time('extract');

unzipInTmpDir(zipAbsolutePath)
    .then(function(tmpDir){
        console.timeEnd('extract');

        return readdir(tmpDir).then(function(selectionZips){
            //console.log("selectionZips", selectionZips);

            //selectionZips = selectionZips.slice(0, 3);
            
            var absoluteZipPaths = selectionZips.map(function(zipPath){
                return path.join(tmpDir, zipPath);
            });

            //console.log(absoluteZipPaths);
            
            //return Q.all(absoluteZipPaths.map(processSelectionDirectory));
            
            return allInSequence(absoluteZipPaths, processSelectionDirectory);
        });
    })
    .then(function(allMetadata){
        //console.log('final result', typeof allMetadata, allMetadata);    

        var metadata = Object.create(null);

        allMetadata.forEach(function(selectionMetadata){
            selectionMetadata.forEach(function(tileMetadata){
                Object.keys(tileMetadata).forEach(function(k){
                    metadata[k] = tileMetadata[k];
                });
            })
        });

        console.log('nb of metadata keys', Object.keys(metadata).length);

        return writeFile(path.join(outAbsolutePath, 'metadata.json'), JSON.stringify(metadata, null, 3));

    })
    .then(function(){

        console.timeEnd('all');

    })
    .fail(function(err){ console.error(err) });




