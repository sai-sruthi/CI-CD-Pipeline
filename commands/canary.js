const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const bakerx = require('../lib/bakerx');
const child = require('child_process');



exports.command = 'canary [brancha] [branchb]';
exports.desc = 'Provision a new local development environment and perform canary analysis';
exports.builder = yargs => {
    yargs.positional('brancha', {
        descrbie: 'first branch name',
        type: 'string',
        default: 'master'
    }).positional('branchb', {
        descrbie: 'second branch name',
        type: 'string',
        default: 'broken'
    });
};


exports.handler = async argv => {
    const { brancha, branchb } = argv;

    (async () => {

        await run( brancha, branchb );

    })();

};

async function run(brancha, branchb) {

    await provision();

}

async function provision(){
    
    console.log(chalk.greenBright('Setting up computing environment!'));

    let image = path.join(os.homedir(), '.bakerx', '.persist', 'images', 'focal', 'box.ovf');

    if(!fs.existsSync(image))
    {
        console.log(chalk.red(`Could not find focal. Pulling focal image with 'bakerx pull focal cloud-images.ubuntu.com'.`));
        await bakerx.execute("pull", `focal cloud-images.ubuntu.com`).catch(e => e);
    }

    await bakerx.execute("run",``).catch(e => e);

}