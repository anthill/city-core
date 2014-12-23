"use strict";

// watchify core-client/client.js -o core-client/app.js -d -v
// node server.js dev core-client

var bordeaux3dCore = require('../index.js');

var bordeaux = bordeaux3dCore(document.querySelector('#view'));

