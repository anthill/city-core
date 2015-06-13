'use strict';

var io = require('socket.io-client');
var ee = require('event-emitter');
var getMetadata = require('./getMetadata.js');
var LimitedEntryMap = require('./LimitedEntryMap.js');

// {id: string, buffer: ArrayBuffer, metadata: Metadata}
var buildingCache = new LimitedEntryMap(10000);

module.exports = function(origin){
    
    //socket
    var socket = io(origin);
    var metadataP = getMetadata(origin);

    var resolveById = new Map();

    function getCityObject(id){
        if(buildingCache.has(id))
            return Promise.resolve(buildingCache.get(id));
        else{
            return new Promise(function(resolve, reject){
                socket.emit('objectNeeded', {id : id});
                resolveById.set(id, resolve);
            });
        }
    }

    socket.on('objectServed', function(msg){
        metadataP.then(function(metadata){
            var id = msg.id;
            var buildingMetadata = metadata[id];
            var resolve = resolveById.get(id);

            if(msg.buffer){
                // console.log('Building Received');
                var buildingData = {
                    id: id,
                    buffer: msg.buffer,
                    metadata: buildingMetadata
                };

                resolve(buildingData);
                buildingCache.set(id, buildingData);

                ret.emit('buildingOk', buildingData);

                msg = undefined; // loose references to the binary buffer
            }
            else{
                // for whatever reason, sometimes, there is no msg.buffer property. Maybe socket.io messes up or something
                // anyway, usually, retrying getting the object works
                // In case it doesn't work, this will create a really bad infinite loop
                setTimeout(function(){
                    getCityObject(msg.id);
                }, 100); // arbitrary amount of time
            }
        });

    });
    
    socket.on('error', function(err){
        console.error('socket err', err);
    })

    var ret = ee({
        getCityObject: getCityObject
    });
    
    return ret;
};