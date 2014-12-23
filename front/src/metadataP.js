'use strict';

module.exports = new Promise(function(resolve, reject){

    var xhr = new XMLHttpRequest();
    
    xhr.open('GET', '/metadata');
    xhr.responseType = 'json';
    
    xhr.addEventListener('load', function(){
        var transportedMetadata = xhr.response;
        // console.log("received metadata", transportedMetadata);

        // transported data are optimized for transport, not for use.
        // one-time transform for easier use. Changing from tile-centered to object-centered representation.
        var metadata = Object.create(null);
        transportedMetadata.forEach(function(tileMetadata){
            Object.keys(tileMetadata.objects).forEach(function(objId){
                var objMetadata = tileMetadata.objects[objId];

                objMetadata.tile = tileMetadata;

                metadata[objId] = objMetadata;
            });     
            delete tileMetadata.objects;
        });
        
        resolve(metadata);
    })
    

    xhr.send();
    
});