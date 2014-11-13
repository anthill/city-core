'use strict';


var gui = require('./gui.js');
var _3dviz = require('./3dviz.js');
var SunCalc = require('suncalc');
var THREE = require('three');

var vec = [0, 0, 0];
var date = new Date();
var radius = 100;
var sunPos;

var nightLightColor     = new THREE.Color(0xffffee);
var nightShadowColor    = new THREE.Color(0x000022);
var dayLightColor       = new THREE.Color(0xfcfce5);
var dayShadowColor      = new THREE.Color(0x27282f);
var tmpLight    = new THREE.Color();
var tmpShadow   = new THREE.Color();
var transitionExp = 5; // exponent of the transition curve


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

        // Compute the dot product of the normalized UP and SUN vectors
        //  1 => sun right up
        //  0 => sun on the horizon
        // -1 => sun right below
        var upVector = new THREE.Vector3(0, 0, 1);
        var sunVector = new THREE.Vector3(vec[0], vec[1], vec[2]);
        sunVector.normalize();
        var dotProduct = upVector.dot(sunVector);

        // Clip to 0-1
        var fact = Math.max(0, dotProduct);

        //console.log(fact);

        // Mix day and night colors depending on sun vector
        tmpLight.setHex(dayLightColor.getHex());
        tmpShadow.setHex(dayShadowColor.getHex());

        tmpLight.lerp(nightLightColor, Math.pow(1 - fact, transitionExp));
        tmpShadow.lerp(nightShadowColor, Math.pow(1 - fact, transitionExp));

        // Update colors in scene
        sunlight.color.setHex(tmpLight.getHex());
        ambientLight.color.setHex(tmpShadow.getHex());

        _3dviz.render();
    }
    
    
    applyLightTargetAtHour(gui.guiControls.hour);

    gui.hourControler.onChange(applyLightTargetAtHour);

    vec = computeDirection(date);
	return vec;
};