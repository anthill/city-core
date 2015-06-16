"use strict";

var path = require('path');
var fs = require("fs");

var Map = require('es6-map');
var Promise = require('es6-promise').Promise;

var express = require('express');

var app = express();
var http = require('http');
var https = require('https');

var compression = require('compression');

var PORT = 9000;


app.use(compression());

app.use("/", express.static(__dirname));


app.listen(PORT, function () {
    console.log('Server running on http://localhost:'+PORT);
});
