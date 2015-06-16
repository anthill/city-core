'use strict';

var stringToInt = Object.freeze({
	'floor': 0x00,
	'building': 0x01,
	'sky': 0x02,
	'hell': 0x03
});

var intToString = {};

Object.keys(stringToInt).forEach(function(k){
    var v = stringToInt[k];
    intToString[v] = k;
});

Object.freeze(intToString);

module.exports = {
	intToString: intToString,
	stringToInt: stringToInt
};