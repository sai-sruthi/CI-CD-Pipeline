const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const fs = require('fs')
const ssh = require('../lib/ssh');
const scp = require('../lib/scp')

const configuration = require('../pipeline/config-srv.json');
const configServerHost = `${configuration.user}@${configuration.ip}`;

var checkbox;
var itrust;

exports.command = 'deploy <job>';
exports.desc = 'Provision cloud instances';
exports.builder = yargs => {
    yargs.options({
        inventory: {
            alias: 'i',
            describe: 'inventory file',
            type: 'string'
        },
    });
};


exports.handler = async argv => {
    const {job, inventory} = argv;

    (async () => {

        await run(job, inventory);

    })();

};


function copyFile(file){
    return new Promise((resolve, reject) => {
        if( fs.existsSync(path.join(__dirname, '..',file))){
            fs.copyFile( path.join(__dirname, '..',file), path.join(__dirname, '..', 'pipeline', 'cloud_inventory.ini'), (err) => {
                if (err) throw(err);
                console.log('File was copied to destination');
                resolve()
            });
        } else {
            throw new Error(`File: <${file}> does not exist. Program terminated.`);
        }
    })
}

async function run(job, inventory) {
    await copyFile(inventory);

    console.log(chalk.greenBright('Deploy'));
    console.log(chalk.magenta(`Running ${job} with ${inventory} inventory file.`));

    if(job == "iTrust"){

        // run playbook for itrust

        console.log(chalk.blueBright('\nDeploying iTrust'));
        let result = ssh(`sudo ansible-playbook /bakerx/pipeline/itrust_playbook.yml -i /bakerx/pipeline/cloud_inventory.ini`, configServerHost);
        if( result.error ) { 
            console.log(result.error); 
            process.exit( result.status ); 
        }

    } else if( job == "checkbox.io"){

        console.log(chalk.blueBright('\nDeploying checkbox'));
        let result = ssh(`sudo ansible-playbook /bakerx/pipeline/checkbox_playbook.yml -i /bakerx/pipeline/cloud_inventory.ini`, configServerHost);
        if( result.error ) { 
            console.log(result.error); 
            process.exit( result.status ); 
        }

    }
}