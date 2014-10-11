'use strict';


var gui = require('./gui.js');
var _3dviz = require('./3dviz.js');
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
    return vec;
}


module.exports = function(sunlight, ambientLight){
    
    function applyLightTargetAtHour(hour){
        date.setHours(hour);
        vec = computeDirection(date);
        var pos = sunlight.position;
        sunlight.target.position.set(pos.x + vec[0], pos.y + vec[1], 0);
        _3dviz.render();
    }
    
    
    applyLightTargetAtHour(gui.guiControls.hour);

    gui.hourControler.onChange(applyLightTargetAtHour);

    vec = computeDirection(date);
	return vec;
};