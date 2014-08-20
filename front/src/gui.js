'use strict';

var dat = require('dat-gui');

// setup the gui
var guiControls = {
    address : "Place Peyberland, Bordeaux",
    altitude : 500,
    hour : 14,
    winter : false
};
var gui = new dat.GUI();
var addressControler = gui.add(guiControls, 'address');
var altitudeControler = gui.add(guiControls, 'altitude',100,3000);
var hourControler = gui.add(guiControls, 'hour',0, 24);
var seasonControler = gui.add(guiControls, 'winter',false);

module.exports = {
    guiControls: guiControls,
    addressControler: addressControler,
    altitudeControler: altitudeControler,
    hourControler: hourControler,
    seasonControler: seasonControler
};