'use strict';

var THREE = require('three');
var ee = require('event-emitter');

var targetToProxy = new WeakMap();
var proxies = new (this.WeakSet || Set)(); // should be a WeakSet, but not supported everywhere and no good polyfill yet

module.exports = function(vector){
    if(Object(vector) !== vector)
        throw new TypeError('vector should be an object');
    
    if(proxies.has(vector))
        return vector;
    var existingProxy = targetToProxy.get(vector);
    if(existingProxy)
        return existingProxy;
    
    var proxy = ee({
        get x(){ return vector.x; },
        get y(){ return vector.y; },
        get z(){ return vector.z; },
        set x(v){
            vector.x = v;
            this.emit('change');
        },
        set y(v){
            vector.y = v;
            this.emit('change');
        },
        set z(v){
            vector.z = v;
            this.emit('change');
        },
        
        distanceTo: function(){
            return vector.distanceTo.apply(vector, arguments);
        },
        add: function(v){
            vector.add(v);
        }
    });
    
    proxies.add(proxy);
    targetToProxy.set(vector, proxy);
    
    return proxy;
}