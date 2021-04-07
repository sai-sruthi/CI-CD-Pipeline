var fs = require('fs')
filePath = "sample.js"
const Random = require('random-js');
var linenumber = require('linenumber');
const { exec } = require('child_process');


var glob = require("glob")

var count = 1;

function main()
{
	var args = process.argv.slice(2);	
	var directoryPath = args[0];
    var getDirectories = function (src, callback) {
		glob(src + '/**/*.java', callback);
    };
      
    getDirectories(directoryPath, function (err, res) {
        if (err) {
            console.log('Error', err);
        } else {
            // console.log(res);
            res.forEach(function(filePath){
                // console.log("Mutating");
                if(count < 12){
                    mutate(filePath);
                }
            });
        }
    });
}

function mutateTarget(filePath, fileArr){
    // console.log(fileArr);
    // Mutating == or !=
    if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '==' in ${filePath}`)
        fileArr = fileArr.replace(/==/g,'!=' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }else if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '!=' in ${filePath}`)
        fileArr = fileArr.replace(/!=/g,'==' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }

     // Mutating 0 or 1
     if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '==' in ${filePath}`)
        fileArr = fileArr.replace(/0/g,'1' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }else if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '!=' in ${filePath}`)
        fileArr = fileArr.replace(/1/g,'0' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }

    // Mutating < or >
    if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '<' in ${filePath}`)
        fileArr = fileArr.replace(/</g,'>' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
        turned = 1;
    }else if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '>' in ${filePath}`)
        fileArr = fileArr.replace(/>/g,'<' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }

    // Mutating || or &&
    if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '||' in ${filePath}`)
        fileArr = fileArr.replace(/\|\|/g,'&&' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }else if( fuzzer.random().bool(0.75) ){
        // console.log(`FUZZING - '&&' in ${filePath}`)
        fileArr = fileArr.replace(/&&/g,'||' );
        fs.writeFile(filePath, fileArr, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }
}

function mutate(filePath){
    // filePath = 'sample.js';
    // Mutate 10% of the provided files
    if( Math.random() > .9 ){
        var fileArr = fs.readFileSync(filePath).toString('utf-8');
        
        console.log(`Mutating File: ${filePath}`);
        mutateTarget(filePath, fileArr);

        count++;
    }      
}
    
class fuzzer {
    static random() {
        return fuzzer._random || fuzzer.seed(0)
    }
    
    static seed (kernel) {
        fuzzer._random = new Random.Random(Random.MersenneTwister19937.seed(kernel));
        return fuzzer._random;
    }
};

main();
exports.main = main;