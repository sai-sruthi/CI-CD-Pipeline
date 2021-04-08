const fs = require('fs');
const Random = require('random-js');
const path = require('path');
//const randomizer = new Random(Random.engines.mt19937().autoSeed());

var validFileExtensions = ["java"];


// This method will read all the files in a directory recursively
const read = (dir) =>
    fs.readdirSync(dir)
    .reduce(function(files, file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            var readFilesList = read(path.join(dir, file));
            if (readFilesList != undefined) {
                return files.concat(readFilesList);
            } else {
                return files;
            }
        } else {
            if (validFileExtensions.indexOf(file.substring(file.lastIndexOf(".") + 1)) > -1) {
                return files.concat(path.join(dir, file));
            } else {
                return files;
            }
        }
    }, []);

// This function implements main fuzzer logic, Throws an error if directory is not given
function main(directoryPath) {
    var args = process.argv.slice(2);

    var dirPath = directoryPath || args[0];

    if (!dirPath)
        throw new Error("not valid directory");

    var listOfFiles = read(dirPath);
    

    listOfFiles.forEach(function(ele) {
        if (fuzzer.random().bool(0.25)){
            
            createRandomChangesInAFile(ele);
         
       }
    });
}

function createRandomChangesInAFile(filePath) {
    var data = fs.readFileSync(filePath, 'utf-8');
   // fs.chmod(filePath, fs.constants.S_IRUSR | fs.constants.S_IWUSR, () => {
        fs.writeFileSync(filePath,'','utf8');
    var lines = data.split("\n");
    
    lines.forEach(function(line) {

        if (fuzzer.random().bool(0.25)) {
            
            let words = line.split(' ');
            
            for(var i = 0; i< words.length; i++)
            {
                if(words[i]==">")
                {
                    words[i] = "<";
                }
                else if(words[i]=="<")
                {
                    words[i] = ">";
                }
                else if(words[i]=="!=")
                {
                    words[i] = "==";
                }
                else if(words[i]=="==")
                {
                    words[i] = "!=";
                }
                else if((words[i].startsWith("'") && words[i].endsWith("'") ) ||(words[i].startsWith('"') && words[i].endsWith('"')))
                {
                    words[i] = words[i].split("").reverse().join("");
                }
                else if(words[i].equals == "true")
                {
                    words[i] = "false";
                }
                else if(words[i].equals == "false")
                {
                    words[i] = "true";
                }
                else if(words[i].equals == "||")
                {
                    words[i] = "&&";
                }
                else if(words[i].equals == "&&")
                {
                    words[i] = "||";
                }
                
            }
            
            line = words.join(" ");
            
            if (line.match(/[0]/)){
                line = line.replace(/[0]/g, "1");
            }
            else if (line.match(/[1]/)){
                line = line.replace(/[1]/,"0");
            }
         }


        if(line != '\r'){
            line += '\n';
        }

        fs.appendFileSync(filePath, line);
    //});
    });
    
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

exports.main = main;