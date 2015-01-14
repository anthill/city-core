'use strict';

var LimitedEntryMap = require('./LimitedEntryMap.js')

/*
    objectId (string) => {mesh: THREE.Mesh, visible: boolean}
*/

module.exports = new LimitedEntryMap(100);
