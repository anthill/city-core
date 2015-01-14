'use strict';

var io = require('socket.io-client');
var ee = require('event-emitter');
var metadataP = require('./metadataP.js');

//socket
var socket = io();

function getCityObject(id){
    socket.emit('object', {id : id});
}

// when receiving a building parse it
socket.on('building', function(msg){    
    
    metadataP.then(function(metadata){
        var buildingMetadata = metadata[msg.id];
        if(msg.buffer){
            var data = {
                msg: msg,
                buildingMetadata: buildingMetadata
            };

            ret.emit('buildingOk', data);

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

var ret = ee({
    getCityObject: getCityObject
});


module.exports = ret;