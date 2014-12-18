"use strict";

var parse = require('csv-parse');
var Promise = require('es6-promise').Promise;
var fs = require('fs');

function csvParse(str){
    console.log('csvParse', str.length);
    
    var parser = parse({delimiter: ','});
    var output = [];
    var firstRow;
    
    return new Promise(function(resolve, reject){
        parser.on('readable', function(){
            var record;
            
            while(record = parser.read()){
                if(firstRow === undefined)
                    firstRow = record;
                else
                    output.push(firstRow.reduce(function(acc, k, i){
                        acc[k] = record[i];
                        return acc;
                    }, {}));
            }
        });

        parser.on('error', function(err){
            reject(err);
        });
        // When we are done, test that the parsed output matched what expected
        parser.on('finish', function(){
            console.log('finish');
            resolve(output);
        });

        parser.write(str);
        parser.end();
    });
}



module.exports = function(path){
    return new Promise(function(resolve, reject){
            fs.readFile(path, function(err, res){
                if(err)
                    reject(err);
                else
                    resolve(res);
            });
        })
        .then(csvParse)
        .then(function(csvContent){
            var res = Object.create(null);
        
            csvContent.forEach(function(line){
                // line: { Z_MIN: '43,898', TUILE: 'tile_x10y100', TO_DALLE: 'BO' }
                var altitude = parseFloat(line['Z_MIN'].replace(',', '.'));
                
                // Number.isNaN test
                if(altitude !== altitude)
                    throw new Error('misunderstood altitude: '+line['Z_MIN']);
                
                var tile = line['TUILE'].match(/x\d{1,4}y\d{1,4}/)[0];
                
                res[tile] = altitude;
            });
        
            return res;
        });
};

