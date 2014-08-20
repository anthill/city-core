'use strict';

// http://fr.wikipedia.org/wiki/Projection_conique_conforme_de_Lambert
// http://geodesie.ign.fr/contenu/fichiers/documentation/rgf93/cc9zones.pdf

// stellar parameters
var a = 6378137; //demi grand axe
var f = 1.0/298.257222101; //applatissement
var b = (1-f)*a;
var e = Math.sqrt(Math.pow(a,2)-Math.pow(b,2))/a;
var pi = Math.PI;
var lon0 = 3*pi/180;



module.exports = function(CC, deltaX, deltaY){
    // CC is the number of the lamber projection 
    // deltaX, deltaY are the shifts from the original center
    var NZ = CC - 41;

    // lambert 94 parameters
    var phi0 = (41.0 + NZ);
    var phi1 = (phi0 - 0.75);
    var phi2 = (phi0 + 0.75);
    phi0 = phi0*pi/180;
    phi1 = phi1*pi/180;
    phi2 = phi2*pi/180;
    var E0 = 1700000;
    var N0 = (NZ * 1000000) + 200000;


    function L(phi) {
        return 0.5*Math.log( (1+Math.sin(phi))/(1-Math.sin(phi)) ) 
            - e/2*Math.log( (1+e*Math.sin(phi))/(1-e*Math.sin(phi)) );
    }

    var n = Math.log( Math.cos(phi2)/Math.cos(phi1) * Math.sqrt(1- Math.pow(e*Math.sin(phi1),2)) / 
            Math.sqrt(1- Math.pow(e*Math.sin(phi2),2))  ) / (L(phi1) - L(phi2));

    var C = a*Math.cos(phi1) * Math.exp(n*L(phi1)) / (n*Math.sqrt(1-Math.pow(e*Math.sin(phi1),2)));

    return {

        toLambert: function(lon, lat) {

            lon = lon * pi/180;
            lat = lat * pi/180;

            var YS = N0 + C * Math.exp( -n * L(phi0) );

            var R = C * Math.exp( -n * L(lat) );

            var gamma = n * (lon - lon0);

            var X = E0 + R * Math.sin(gamma);
            var Y =  YS - R * Math.cos(gamma); 

            return {X : X - deltaX, Y : Y - deltaY};

        },

        // this function takes X, Y in a lamber cc projection and outputs lon,lat in rgf93 fomat which we assume to be equal to WGS94 (GPS)
        toLonLat: function(X, Y) {


            var dX = X + deltaX - E0;
            var dY = Y + deltaY - N0 - C * Math.exp(-n * L(phi0));

            var R = Math.sqrt(dX * dX + dY * dY );

            var gamma = Math.atan(-dX / dY)

            var lon = gamma/n + lon0;

            // dichotomy
            var p0 = 2 * Math.atan( Math.pow(C/R, 1/n) ) - pi/2;
            var p1 = 2 * Math.atan( Math.pow(C/R, 1/n) * Math.pow((1+e*Math.sin(p0))/(1-e*Math.sin(p0)), e/2) ) - pi/2;
            var delta = Math.abs( p1 - p0 );
            while( delta > 0.000001 ){
                p0 = p1;
                p1 = 2 * Math.atan( Math.pow(R/C, 1/n) * Math.pow((1+e*Math.sin(p0))/(1-e*Math.sin(p0)), e/2) ) - pi/2; 
                delta = Math.abs( p1 - p0 );
            }

            return {lon:lon*180/pi, lat:p1*180/pi};
        }
    }

}

