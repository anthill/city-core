"use strict";

var app = require('express')();
var http = require('http').createServer(app);
var rbush = require('rbush');
var fs = require("fs");
var Map = require('es6-map');

// defs
var server = "//localhost"
var port = 3000


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


// initialize the rtree
var tree = rbush(100000);

// reading the file describing the position of each buildings and inserting in rtree
fs.readFile("data/metadata.json", 'utf8', function (err,data) {
  if (err) console.log(err);
  var jsondata = JSON.parse(data);
  Object.keys(jsondata).forEach(function(file) {
  	var building = jsondata[file];
  	var X = building.X;
  	var Y = building.Y;
  	var item = [building.xmin + X*200, building.ymin + Y*200, building.xmax + X*200, building.ymax+ Y*200, {name: file, X:X, Y:Y}];
	tree.insert(item);
  });

});


// websocket: when a user connects we create a token
var io = require('socket.io')(http);
app.use("/ext", require('express').static(__dirname + '/front/ext'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});




var clients = Map();
io.on('connection', function (socket) {
	// create token
	var token = randomString(12);
	var address = server + ":" + port.toString() + "/within?s=" + token;
	socket.emit('endpoint', address);
	clients.set(token, socket);
});



app.get('/within', function(req, res) {
	var results = tree.search([req.param("west"), req.param("south"), req.param("east"), req.param("north")]);
	console.log(results.length);
	// sending the binary
	var buildings = results.map(function(result) {
		var path = "data/" + result[4].name

	    fs.readFile(path, function (err, buffer) {
	    	clients.get(req.param("s")).emit("building", {buffer : buffer, X : result[4].X, Y : result[4].Y});
	    });

	});
	
  	res.send("ok");
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
