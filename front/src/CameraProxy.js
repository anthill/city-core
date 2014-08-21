'use strict';

//var THREE = require('three');
var ee = require('event-emitter');

var VectorProxy = require('./VectorProxy.js');

var targetToProxy = new WeakMap();
var proxies = new (this.WeakSet || Set)(); // should be a WeakSet, but not supported everywhere and no good polyfill yet

/*
    camera is a THREE.Camera
    
    A CameraProxy is like a THREE.Camera object with a few differences:
    * It's an event emitter (API on, off, once, emit). It emits a `cameraviewchange` event anytime the camera view changes
    * A frozen {x, y, z} copy of the "lookAt vector" is available via the lookAtVector getter
    * The up getter returns a frozen {x, y, z} copy
    * camera.position is a VectorProxy which allows to track changes to the vector directly
    
*/
module.exports = function(camera){
    if(Object(camera) !== camera)
        throw new TypeError('camera should be an object');
    
    if(proxies.has(camera))
        return camera;
    var existingProxy = targetToProxy.get(camera);
    if(existingProxy)
        return existingProxy;
    
    
    var scheduledChangeEvent = false;
    function scheduleChangeEvent(){
        if(scheduledChangeEvent)
            return;
        
        setTimeout(function(){
            scheduledChangeEvent = false;
            proxy.emit('cameraviewchange');
        }, 0);
        
        scheduledChangeEvent = true;
    }
    
    
    var lookAtVector;
    var positionProxy = VectorProxy(camera.position);
    positionProxy.on('change', scheduleChangeEvent);
    
    var proxy = ee({
        get lookAtVector(){ return lookAtVector ? Object.freeze({
            x: lookAtVector.x,
            y: lookAtVector.y,
            z: lookAtVector.z
        }) : undefined; },
        get up(){
            return Object.freeze({
                x: camera.up.x,
                y: camera.up.y,
                z: camera.up.z
            })
        },
        get position(){
            return positionProxy;
        }, 
        lookAt: function(v){
            camera.lookAt(v);
            lookAtVector = v;
            
            scheduleChangeEvent();
        },
        set up(v){
            camera.up = v;
            
            scheduleChangeEvent();
        },
        set position(v){
            camera.position.x = v.x;
            camera.position.y = v.y;
            camera.position.z = v.z;
            
            scheduleChangeEvent();
        },
        
        /* other properties proxying */
        get fov(){ return camera.fov; },
        get aspect(){ return camera.aspect; },
        set aspect(v){ camera.aspect = v; },
        get projectionMatrix(){ return camera.projectionMatrix; },
        get matrixWorld(){ return camera.matrixWorld; },
        
        updateProjectionMatrix: function(){
            camera.updateProjectionMatrix.apply(camera, arguments);
        }
    });
    
    
    proxies.add(proxy);
    targetToProxy.set(camera, proxy);
    
    return proxy;
}