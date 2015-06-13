"use strict";

var Map = require('es6-map');
var Promise = require('es6-promise').Promise;

var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('graceful-fs');

var program = require('commander');
var tmp = require('tmp');
var promisify = require("es6-promisify");

var _3dsObjectToBuildingBuffersAndMetadata = require('./_3dsObjectToBuildingBuffersAndMetadata');
var parse3ds = require('./parse3ds.js');

var getTileAltitudes = require('./getTileAltitudes.js');
var tileAltitudesP = getTileAltitudes(path.resolve(__dirname, '../data/DALLAGE_3D.csv'));

function tmpdir(){
    return new Promise(function(resolve, reject){
        tmp.dir(function(err, dir){
            if(err) reject(err); else resolve(dir);
        });
    });
}
var readdir = promisify(fs.readdir);
var readFile = promisify(fs.readFile);
var writeFile = promisify(fs.writeFile);
var lstat = promisify(fs.lstat);


/*
    Takes an Array<T> and a function(x: T) => Promise<U>
    Processes each array element in sequence.
*/
function allInSequence(arr, f){
    if(arr.length === 0){
        return Promise.resolve([]);
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


function extractBuildings(_3dsPath, x, y){
    //console.log('extracting buildings from', _3dsPath);
    
    return new Promise(function(resolve, reject){
        parse3ds(_3dsPath, function(err, data){
            if(err){
                reject(err);
                return;
            }
            
            var key = _3dsPath.match(/x\d{1,4}y\d{1,4}/)[0];
            
            resolve(tileAltitudesP.then(function(tilesAltitudes){
                var deltaZ = tilesAltitudes[key];
                
                return _3dsObjectToBuildingBuffersAndMetadata(data, x, y, deltaZ);
            }));
        });
    });
}


function unzipInTmpDir(pathToZip){
    var readStream = fs.createReadStream(pathToZip);

    return tmpdir().then(function(tmpDir){
        return new Promise(function(resolve, reject){
            var args = [pathToZip, '-d', tmpDir];
            
            //console.log('unzip', args.join(' '));
            
            var unzipProc = spawn('unzip', args);
            
            unzipProc.on('exit', function(code, signal){
                resolve(tmpDir);
            });
        });
    });
}


/*
    Process the directory of a single selection
*/
function processSelectionDirectory(selectionZipDirPath){
    console.log('processing', selectionZipDirPath);

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

                    return Promise.all(tile3dsPathsAndxy.map(function(tpxy){
                        var tile3dsPath = tpxy.path;
                        var x = tpxy.x;
                        var y = tpxy.y;

                        return extractBuildings(tile3dsPath, x, y).then(function(res){
                            var buildingBuffers = res.buildingBuffers;
                            var tileMetadata = res.tileMetadata;

                            return Promise.all(Object.keys(buildingBuffers).map(function(id){
                                var buildingOutPath = path.join(outAbsolutePath, id);
                                
                                // despite graceful-fs, we see some EMFILE errors in writes
                                function tryWriteFile(){
                                    return writeFile(buildingOutPath, buildingBuffers[id]).catch(function(err){
                                        if(String(err).indexOf('EMFILE') !== -1){
                                            console.error('tryWriteFile EMFILE', selectionName, x, y, tile3dsPath, err);
                                            return new Promise(function(resolve){
                                                setTimeout(function(){
                                                    resolve(tryWriteFile());
                                                }, 100);
                                            });
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

                        }).catch(function(err){
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

            var absoluteZipPaths = selectionZips.map(function(zipPath){
                return path.join(tmpDir, zipPath);
            });

            return allInSequence(absoluteZipPaths, processSelectionDirectory);
        });
    })
    .then(function(dallesMetadata){
        var tilesMetadata = dallesMetadata.reduce(function(acc, tm){
            return acc.concat(tm)
        }, [])

        var nbObjects = tilesMetadata.reduce(function(acc, tm){
            return acc + Object.keys(tm.objects).length;
        }, 0)

        console.log('nb of objects', nbObjects);

        return writeFile(path.join(outAbsolutePath, 'metadata.json'), JSON.stringify(tilesMetadata));

    })
    .then(function(){ console.timeEnd('all'); })
    .catch(function(err){ console.error(err) });




