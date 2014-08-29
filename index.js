"use strict";

var path = require('path');
var fs = require("fs");

var Map = require('es6-map');
var Promise = require('es6-promise').Promise;

var app = require('express')();
var http = require('http').createServer(app);

// defs
var server = "//localhost";
var PORT = 3000;
var MAXY = 170;

process.title = 'Bdx3d server';


// websocket: when a user connects we create a token
var io = require('socket.io')(http);
app.use("/polyfills", require('express').static(__dirname + '/front/src/polyfills'));
app.use("/img", require('express').static(__dirname + '/front/img'));
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'front/index.html'));
});
app.get('/app.js', function(req, res){
  res.sendFile(path.join(__dirname, 'front/app.js'));
});



var metadataP = new Promise(function(resolve, reject){
    fs.readFile("front/data/metadata.json", 'utf8', function (err, data){
        if(err){
            reject(err);
            return;
        }
        
        console.log('metadata length', data.length);
        
        resolve(data);
    });
});

io.on('connection', function (socket) {
    
    metadataP.then(function(metadataString){
        socket.emit('metadata', {metadata : metadataString});
    });

    //when receiving queries send back the data
    socket.on('object', function (msg) {
        var path = "front/data/" + msg.id;
      
        //console.log('asked object', msg.id);
        fs.readFile(path, function (err, data) {
            socket.emit("building", {id : msg.id, buffer : data});
        });

    });

});



http.listen(PORT, function () {
    console.log('listening http://localhost:'+PORT);
});
