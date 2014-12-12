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

// defs

var mode = process.argv[2] || "dev";

var config = require("./" + path.join("config", mode+".json"))

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


process.title = 'Bdx3d server';



function makeDocument(htmlFragment){
    return new Promise(function(resolve, reject){
        jsdom.env(htmlFragment, function(err, window){
            if(err) reject(err);
            else resolve(window.document);
        });
    })
}

// get the index.html
var indexP = new Promise(function(resolve, reject){
    fs.readFile("front/index.html", 'utf8', function (err, data){
        if(err){
            reject(err);
            return;
        }        
        resolve(makeDocument(data));
    });
});

// get the metadata
var metadataP = new Promise(function(resolve, reject){
    fs.readFile("front/data/metadata.json", 'utf8', function (err, data){
        if(err){
            reject(err);
            return;
        }        
        resolve(data);
    });
});


// once the json is readed, we can start the service and send index.html
Promise.all([indexP, metadataP]).then(function(results){
    var indexDocument = results[0];
    var metadataString = results[1];
    var metaSpace = indexDocument.querySelector('script#metadata');
    metaSpace.textContent = metadataString;
    var indexHtml = '<!doctype html>\n' + indexDocument.documentElement.outerHTML;

    // websocket: when a user connects we create a token
    // gzip/deflate outgoing responses
    app.use(compression())
    app.use("/polyfills", express.static(__dirname + '/front/src/polyfills'));
    app.use("/img", express.static(__dirname + '/front/img'));
    
    app.get('/', function(req, res){
      res.send(indexHtml);
    });
    app.get('/app.js', function(req, res){
      res.sendFile(path.join(__dirname, 'front/app.js'));
    });

    io.on('connection', function (socket) {

        //when receiving queries send back the data
        socket.on('object', function (msg) {
            var path = "front/data/" + msg.id;
          
            //console.log('asked object', msg.id);
            fs.readFile(path, function (err, data) {
                socket.emit("building", {id : msg.id, buffer : data});
            });

        });

    });


}).catch(function(err){console.error(err)});

server.listen(PORT, function () {
    console.log('Server running on ' + PORT);
});

