"use strict";

var path = require('path');
var fs = require("fs");
var jsdom = require('jsdom');

var Map = require('es6-map');
var Promise = require('es6-promise').Promise;

var app = require('express')();
var http = require('http')
var https = require('https');

var express = require('express');
var compression = require('compression');

// arguments
var mode = process.argv[2] || "dev";
var config = require("./" + path.join("config", mode+".json")); // will throw if file not found

var indexDir = process.argv[3] || "front";
var indexHTML = fs.readFileSync(path.join(__dirname, indexDir, 'index.html'),'utf8'); // will throw if not found;


var PORT = config.port;

console.log('starting in mode', mode)

var server;
if(config.https){
    var options = {
        key: fs.readFileSync(config.keypath),
        cert: fs.readFileSync(config.certpath)
    };
    
    server = https.createServer(options, app);
}
else{
    server = http.createServer(app);
}

var io = require('socket.io')(server);


process.title = 'City-core server';


function makeDocument(htmlFragment){
    return new Promise(function(resolve, reject){
        jsdom.env(htmlFragment, function(err, window){
            if(err) reject(err);
            else resolve(window.document);
        });
    })
}


// get the metadata
var metadataP = new Promise(function(resolve, reject){
    fs.readFile("front-data/metadata.json", 'utf8', function (err, data){
        if(err){
            reject(err);
            return;
        }        
        resolve(data);
    });
});


var indexDocP = makeDocument(indexHTML)

// once the json is readed, we can start the service and send index.html
Promise.all([indexDocP, metadataP]).then(function(results){
    var indexDocument = results[0];
    var metadataString = results[1];
    
    /*var metaSpace = indexDocument.querySelector('script#metadata');
    metaSpace.textContent = metadataString;*/
    var indexHtml = '<!doctype html>\n' + indexDocument.documentElement.outerHTML;

    // gzip/deflate outgoing responses
    app.use(compression())
    app.use("/polyfills", express.static(__dirname + '/front/src/polyfills'));
    app.use("/img", express.static(__dirname + '/front/img'));
    
    app.get('/', function(req, res){
      res.send(indexHtml);
    });
    app.get('/app.js', function(req, res){
      res.sendFile(path.join(__dirname, indexDir, 'app.js'));
    });

    app.get('/metadata', function(req, res){
        // TODO support query a rtree with the metadata
        // console.log('/metadata', req.query);
        
        res.sendFile(path.join(__dirname, 'front-data/metadata.json'));
    });
    
    io.on('connection', function (socket) {

        //when receiving queries send back the data
        socket.on('object', function (msg) {
            var baseBinariesPath = path.join(__dirname, "front-data");
            var p = path.resolve(baseBinariesPath, msg.id);
            
            var relativeObjectPath = path.relative(baseBinariesPath, p);
            
            
          
            //console.log('asked object', msg.id);
            fs.readFile(p, function (err, data) {
                socket.emit("building", {id : msg.id, buffer : data});
            });

        });

    });


}).catch(function(err){console.error(err)});

server.listen(PORT, function () {
    console.log('Server running on ' + PORT);
});

