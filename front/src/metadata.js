'use strict';

module.exports = (function getMetadata(){
    var metadataElement = document.querySelector('script#metadata')
    var metadataString = metadataElement.textContent;
    var transportedMetadata = JSON.parse(metadataString);
    // console.log("received metadata", transportedMetadata);

    // transported data are optimized for transport, not for use.
    // one-time transform for easier use. Changing from tile-centered to object-centered representation.
    var metadata = Object.create(null)
    transportedMetadata.forEach(function(tileMetadata){
        Object.keys(tileMetadata.objects).forEach(function(objId){
            var objMetadata = tileMetadata.objects[objId];
            
            objMetadata.tile = tileMetadata;
            
            metadata[objId] = objMetadata;
        });     
        delete tileMetadata.objects;
    });
    metadataElement.parentNode.removeChild(metadataElement);

    return metadata;
})();