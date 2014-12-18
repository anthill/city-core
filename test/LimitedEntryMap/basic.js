"use strict";

var assert = require('assert');
var LimitedEntryMap = require('../../front/src/LimitedEntryMap.js');

// Empty map
var oneEntryMap = new LimitedEntryMap(1);

assert.strictEqual(oneEntryMap.size, 0);

// Add one entry
oneEntryMap.set('a', 37);

assert.strictEqual(oneEntryMap.size, 1);
assert.strictEqual(oneEntryMap.get('a'), 37);
assert.strictEqual(oneEntryMap.has('a'), true);
    
// Add another entry. This should kick the first entry out.
oneEntryMap.set('b', 21);

assert.strictEqual(oneEntryMap.size, 1);
assert.strictEqual(oneEntryMap.get('a'), undefined);
assert.strictEqual(oneEntryMap.get('b'), 21);
assert.strictEqual(oneEntryMap.has('a'), false);
assert.strictEqual(oneEntryMap.has('b'), true);

// Change binding value
oneEntryMap.set('b', 54);
    
assert.strictEqual(oneEntryMap.size, 1);
assert.strictEqual(oneEntryMap.get('a'), undefined);
assert.strictEqual(oneEntryMap.get('b'), 54);
assert.strictEqual(oneEntryMap.has('a'), false);
assert.strictEqual(oneEntryMap.has('b'), true);

