'use strict';

var cachedMetadata;

module.exports = function getMetadata(origin){
    return new Promise(function(resolve, reject){
        if(cachedMetadata)
            resolve(cachedMetadata);
        else{
            var xhr = new XMLHttpRequest();

            xhr.open('GET', origin+'/metadata');
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

                cachedMetadata = metadata;
                resolve(metadata);
            });

            xhr.addEventListener('error', function(err){
                reject(err);
            });

            xhr.send();
        }
    });
}