'use strict';

var dat = require('dat-gui');

// setup the gui
var guiControls = {
    address : "Place Peyberland, Bordeaux",
    hour : 18
};
var gui = new dat.GUI();
var addressControler = gui.add(guiControls, 'address');
var hourControler = gui.add(guiControls, 'hour', 0, 24);

module.exports = {
    guiControls: guiControls,
    addressControler: addressControler,
    hourControler: hourControler
};