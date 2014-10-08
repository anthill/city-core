"use strict";

var path = require('path');
var fs = require('graceful-fs');

var program = require('commander');
var unzip = require('unzip');
var tmp = require('tmp');
var Q = require('q');
var Map = require('es6-map');

var containingCube = require('../src/containingCube.js');
var computeMeshVolume = require('../src/computeMeshVolume.js');
var _3dsFormatToAntsBinaryBuffer = require('../src/3dsFormatToAntsBinaryBuffer.js');
var parse3ds = require('../src/parse3ds.js');

var tilesAltitudes;

try{
    tilesAltitudes = require('../data/tilesAltitudes.json');
}
catch(e){
    console.warn('missing data/tilesAltitudes.json file', e);
}

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


// name => next nb to use to append to the name to make it unique
var ids = new Map();

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

        if(deltaX !== 0 || deltaY !== 0){
            // apply translation to all tile objects
            meshes.forEach(function(m){
                m.vertices.forEach(function(v){
                    v.x += deltaX;
                    v.y += deltaY;
                });
            });
        }


        if(tilesAltitudes){
            // correct altitude

            var key = _3dsPath.match(/x\d{1,4}y\d{1,4}/)[0];

            var deltaZ = tilesAltitudes[key];

            meshes.forEach(function(m){
                m.vertices.forEach(function(v){
                    v.z += deltaZ;
                });
            });
        }


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
            var objectCube = containingCube(m);

            tileMetadata.objects[m.id] = {
                x: Math.round( (objectCube.minX + objectCube.maxX)/2 ),
                y: Math.round( (objectCube.minY + objectCube.maxY)/2 )
            };
        });

        def.resolve({
            buildingBuffers: buildingBuffers,
            tileMetadata : tileMetadata
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

    var selectionName = path.basename(selectionZipDirPath, '.zip'); // assumed 2 letters like "RL"

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
                            var tileMetadata = res.tileMetadata;

                            return Q.all(Object.keys(buildingBuffers).map(function(id){
                                var buildingOutPath = path.join(outAbsolutePath, id);
                                
                                // despite graceful-fs, we see some EMFILE errors in writes
                                function tryWriteFile(){
                                    return writeFile(buildingOutPath, buildingBuffers[id]).fail(function(err){
                                        if(String(err).indexOf('EMFILE') !== -1){
                                            console.error('tryWriteFile EMFILE', selectionName, x, y, tile3dsPath, err)
                                            var def = Q.defer();
                                            
                                            // retry later
                                            setTimeout(function(){
                                                def.resolve(tryWriteFile());
                                            }, 100);

                                            return def.promise;
                                        }
                                        else{// forward error
                                            throw err;
                                        }
                                    })
                                }
                                
                                return tryWriteFile();
                            })).then(function(){
                                // metadata is returned when all building binary files have been written
                                return tileMetadata;
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
    .then(function(dallesMetadata){
        //console.log('final result', dallesMetadata);

        var tilesMetadata = dallesMetadata.reduce(function(acc, tm){
            return acc.concat(tm)
        }, [])

        var nbObjects = tilesMetadata.reduce(function(acc, tm){
            return acc + Object.keys(tm.objects).length;
        }, 0)

        console.log('nb of objects', nbObjects);

        return writeFile(path.join(outAbsolutePath, 'metadata.json'), JSON.stringify(tilesMetadata));

    })
    .then(function(){

        console.timeEnd('all');

    })
    .fail(function(err){ console.error(err) });




