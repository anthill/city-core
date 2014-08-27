'use strict';


var gui = require('./gui.js');
var SunCalc = require('suncalc');

var vec = [0, 0, 0];
var date = new Date();
var radius = 100;
var sunPos;

function computeDirection(date){
	sunPos = SunCalc.getPosition(date, -0.573781, 44.840484);
    var lightX = radius * Math.cos(sunPos.altitude) * Math.cos(sunPos.azimuth);
    var lightY = radius * Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth);
    var lightZ = radius * Math.tan(sunPos.altitude);
    vec = [lightX, lightY, lightZ];
    return vec
}

module.exports = function(light){

	gui.hourControler.onChange(function(value) {
	    
	    date.setHours(value);
	    vec = computeDirection(date)
	    var pos = light.position;
	    light.target.position.set(pos.x + vec[0], pos.y + vec[1], 0)

	});

    vec = computeDirection(date);
	return vec;
};