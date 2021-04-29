const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const bakerx = require('../lib/bakerx');
const child = require('child_process');
const ssh = require('../lib/ssh');
const configuration = require('../local-env.json');
const blue = configuration.blue;
const green = configuration.green;

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
    await initiateApp(brancha, blue);
    await initiateApp(branchb, green);
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

async function initiateApp(branch, site) {

    host = `${site.user}@${site.ip}`;
    console.log(chalk.greenBright('Installing and starting micro-service!'));
    
    //Kill stray node processes
    await ssh(`sudo killall node`, host);

    //clean and clone
    await ssh(`sudo rm -r ~/checkpoint.io/www; sudo mkdir ~/checkpoint.io/www; cd ~/checkpoint.io/www; sudo git clone -b ${branch} https://github.com/chrisparnin/checkbox.io-micro-preview.git`, host);
    
    //npm install and pm2 start
    await ssh(`cd ~/checkpoint.io/www/checkbox.io-micro-preview;sudo npm install; sudo pm2 start index.js;`, host);

}

