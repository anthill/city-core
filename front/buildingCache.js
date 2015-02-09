'use strict';

var LimitedEntryMap = require('./LimitedEntryMap.js');

// {id: string, buffer: ArrayBuffer, metadata: Metadata}
module.exports = new LimitedEntryMap(10000);