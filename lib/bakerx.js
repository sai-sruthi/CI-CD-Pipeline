const exec = require('child_process').exec;
const Bakerexe = 'bakerx';
const chalk = require('chalk');

module.exports.execute = function(cmd, args) {

    let verbose = true;

    return new Promise(function (resolve, reject) {

        let runCmd = `${Bakerexe} ${cmd} ${args}`;

        if( verbose )
        {
            console.log( chalk.gray(`Executing ${runCmd}`) );
        }

        exec(runCmd, (error, stdout, stderr) => {

            if(error && stderr.indexOf('BAKERX_NOT_FOUND') == -1) {
                reject(error);
            } 
            else 
            {
                resolve(stdout, stderr);
            }

        });

    }.bind({cmd, args, verbose}));

};

module.exports.show = async function(vmname) {
        return new Promise(function (resolve, reject) {   
            exec(`${VBexe} showvminfo ${vmname} --machinereadable`, (error, stdout, stderr) => {
                if(error && stderr.indexOf('VBOX_E_OBJECT_NOT_FOUND') != -1) {
                    resolve({VMState:'not_found'});
                }
                else if( error )
                {
                    console.error(`=> ${error}, ${stderr}`);
                    reject(error);
                }
                else
                {
                    let properties = {state:'unknown'};
                    let lines = stdout.split('\n');
                    for (let i = 0; i < lines.length-1; i++) {
                        let lineSplit = lines[i].split('=');
                        let name= lineSplit[0].trim();
                        let id = lineSplit[1].trim();
                        properties[name]=id.toString();
                    }
                    resolve(properties.VMState.replace(/"/g,''));
                }
            });
        });
    }

