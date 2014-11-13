'use strict';


module.exports = function geoCode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json?address=";

    return new Promise(function(resolve) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url+address);
        xhr.responseType = 'json';

        xhr.addEventListener('load', function(){
            var data = xhr.response
            var lon = data.results[0].geometry.location.lng;
            var lat = data.results[0].geometry.location.lat;
            console.log(lon,lat);
            resolve({lon : lon, lat : lat});
        });
        xhr.send();
    });
}