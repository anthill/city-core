"use strict";

var app = require('express')();
var http = require('http').createServer(app);
var fs = require("fs");
var Map = require('es6-map');

// defs
var server = "//localhost";
var PORT = 3000;
var MAXY = 170;


// polyfill
if (!Array.prototype.fill) {
  Array.prototype.fill = function(value) {

    // Steps 1-2.
    if (this == null) {
      throw new TypeError("this is null or not defined");
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0;

    // Step 8.
    var k = relativeStart < 0 ?
      Math.max(len + relativeStart, 0) :
      Math.min(relativeStart, len);

    // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ?
      len : end >> 0;

    // Step 11.
    var final = relativeEnd < 0 ?
      Math.max(len + relativeEnd, 0) :
      Math.min(relativeEnd, len);

    // Step 12.
    while (k < final) {
      O[k] = value;
      k++;
    }

    // Step 13.
    return O;
  };
}

// generate token
function randomString(length){
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
    return Array(length).fill()
        .map(function() { return chars[ Math.floor(chars.length*Math.random()) ]})
        .join('');
}


// websocket: when a user connects we create a token
var io = require('socket.io')(http);
app.use("/ext", require('express').static(__dirname + '/front/ext'));
app.get('/', function(req, res){
  res.sendfile('front/index.html');
});




var clients = Map();
io.on('connection', function (socket) {
	// create token
	var token = randomString(12);
  // sending metadata + tocken
  fs.readFile("front/data/metadata.json", 'utf8', function (err, data) {
    if (err) console.log(err);
  	socket.emit('endpoint', {token: token, metadata : data});
  });
	clients.set(token, socket);

  //when receiving queries send back the data
  socket.on('object', function (msg) {
    var path = "front/data/" + msg.id
    fs.readFile(path, function (err, data) {
      clients.get(msg.token).emit("building", {id : msg.id, buffer : data});
    });

  });

});



http.listen(PORT, function () {
    console.log('listening http://localhost:'+PORT);
});
