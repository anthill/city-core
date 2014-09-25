"use strict";

var path = require('path');
var fs = require('graceful-fs');

var program = require('commander');
var unzip = require('unzip');
var tmp = require('tmp');
var DOMParser = require('xmldom').DOMParser;
var Promise = require('es6-promise').Promise;
var promisify = require('es6-promisify');

// create tmp directory
function tmpdir(){
    return new Promise(function (resolve, reject){
        tmp.dir(function (err, dir){
            if(err)
                reject(err);
            else
                resolve(dir);
        });
    });
}

var readdir = promisify(fs.readdir);
var readFile = promisify(fs.readFile);
var writeFile = promisify(fs.writeFile);
var lstat = promisify(fs.lstat);

program
    .version('0.0.1')
    .option('--zip [path]', 'path to zip file')
    .parse(process.argv);

if(!program.zip)
    throw new Error('--zip parameters are compulsory');

var zipAbsolutePath = path.resolve(process.cwd(), program.zip);

console.log(zipAbsolutePath);

// Unzip XML.zip into tmp directory
function unzipInTmpDir(pathToZip){
    var readStream = fs.createReadStream(pathToZip);

    return tmpdir().then(function(tmpDir){
        return new Promise(function (resolve, reject){
            var extractWriteStream = unzip.Extract({ path: tmpDir });
            readStream.pipe(extractWriteStream);

            extractWriteStream.on('close', function(e){ // 'close' event, unlike 'finish' guarantees all writes to disk are finished
                //console.log('close');
                resolve(tmpDir);
            });
        });
    });
}

console.time('all');
console.time('extract');

unzipInTmpDir(zipAbsolutePath)
    .then(function (tmpDir){
        console.timeEnd('extract');

        return readdir(tmpDir).then(function (geoxmls){
            // function that reads each geoXML and parse it into a JSON file

            var absoluteGeoxmlPaths = geoxmls.map(function (geoxmlPath){
                // get all absolute paths
                return path.join(tmpDir, geoxmlPath);
            });

            return Promise.all(absoluteGeoxmlPaths.map(function(geoxml){
                
                var key = geoxml.match(/x\d{1,4}y\d{1,4}/)[0];

                // read the geoXML file
                return readFile(geoxml)
                .then(function (buffer){
                    var xmlString = buffer.toString('utf8');
                    var doc = new DOMParser().parseFromString(xmlString);
                    var geoPositions = doc.getElementsByTagName("geoPosition");

                    if (geoPositions.length >= 2){
                        console.warn(geoxml, 'has more than one <geoPosition>');
                    }

                    var values = geoPositions[0].textContent.trim().split(" ");

                    if (values.length > 3){
                        console.warn(geoxml, '<geoPosition> has more than 4 values');
                    }

                    return [key, parseFloat(values[2])];
                })
            }));
        });
    })
    .then(function(assocs){

        var obj = assocs.reduce(function(acc, curr){
            acc[curr[0]] = curr[1];

            return acc;
        }, {});

        writeFile('./data/tilesAltitudes.json', JSON.stringify(obj, null, 3));

        console.timeEnd('all');

    })
    .catch(function (err){ console.error(err) });
