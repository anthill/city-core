"use strict";

var path = require('path');
var fs = require("graceful-fs");

var Map = require('es6-map');
var Promise = require('es6-promise').Promise;

var express = require('express');

var app = express();
var http = require('http');

var compression = require('compression');


var mainDirRelative = process.argv[3];
if(!mainDirRelative){
    throw 'missing process.argv[3]';
}

var mainDir = path.join(process.cwd(), mainDirRelative);

var metadataPath = path.join(mainDir, 'data', 'metadata.json');

var baseBinariesPath =path.join(mainDir, 'data');


var PORT = 9000;

var server = http.createServer(app);

var io = require('socket.io')(server);

process.title = 'City-core server';


// get the metadata
var metadataP = new Promise(function(resolve, reject){
    fs.readFile(metadataPath, 'utf8', function (err, data){
        if(err){
            reject(err);
            return;
        }        
        resolve(data);
    });
});


// once the json is readed, we can start the service and send index.html
metadataP.then(function(metadataString){

    // gzip/deflate outgoing responses
    app.use(compression());
    
    // Allow CORS headers since it's an API
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
        next();
    });
    
    app.use("/img", express.static(path.join(__dirname, '..', 'img')));

    app.get('/metadata', function(req, res){
        // TODO support query a rtree with the metadata
        // console.log('/metadata', req.query);
        console.log('/metadata', metadataPath);
        res.sendFile(path.join(__dirname, 'front/data/metadata.json'));
        //res.sendFile(metadataPath);
    });
    
    // for cross-origin requests
    // http://stackoverflow.com/questions/15771805/how-to-set-socket-io-origins-to-restrict-connections-to-one-url/21711242#21711242
    io.set('origins', '*:*');
    
    io.on('connection', function(socket) {

        //when receiving queries send back the data
        socket.on('objectNeeded', function(msg) {
            var p = path.resolve(baseBinariesPath, msg.id);
            var relativeObjectPath = path.relative(baseBinariesPath, p);
            
            if(relativeObjectPath.indexOf('..') === 0){ 
                // relative path begins with .. which seems like an attempt to read server files (security issue)
                socket.emit('error', 'Incorrect building id: '+msg.id);
                return;
            }
          
            //console.log('asked object', msg.id);
            fs.readFile(p, function (err, data) {
                socket.emit("objectServed", {id : msg.id, buffer : data});
            });

        });

    });

}).catch(function(err){console.error(err)});

server.listen(PORT, function () {
    console.log('Server running on http://localhost:'+PORT);
});
