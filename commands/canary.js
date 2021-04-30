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
const proxy =configuration.proxy; 

var monitor_push = require('../servers/commands/push.js');

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
    monitor_push.run();
    await runApp(brancha, blue);
    await runApp(branchb, green);

    await canaryDashboard();

   // await deleteApp();
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
    console.log(chalk.greenBright('Installing micro-service!'));
    
    //Kill stray node processes
    await ssh(`sudo killall node`, host);

    //clean and clone
    await ssh(`sudo rm -r ~/checkpoint.io/www; sudo mkdir ~/checkpoint.io/www; cd ~/checkpoint.io/www; sudo git clone -b ${branch} https://github.com/chrisparnin/checkbox.io-micro-preview.git`, host);
   
}

async function runApp(branch, site){

    host = `${site.user}@${site.ip}`;
    console.log(chalk.greenBright('Starting micro-service!'));

    //npm install and pm2 start
    await ssh(`cd ~/checkpoint.io/www/checkbox.io-micro-preview;sudo npm install; sudo pm2 start index.js;`, host);

}

async function canaryDashboard(){

    host = `${proxy.user}@${proxy.ip}`;

    // npm install in dashboard
     console.log(chalk.blueBright('\nInstalling dependencies for traffic monitoring app'));
     result = ssh('cd /bakerx/canary_dashboard; sudo npm install ; sudo node app.js',  host);
     if( result.error ) { process.exit( result.status ); }
}

async function deleteApp(){
    console.log(chalk.blueBright('\nDestroying Servers [Blue, Green, Proxy]'));
    child.exec('bakerx delete vm blue; bakerx delete vm green; bakerx delete vm proxy', (err) => {
        if (err) {
            console.error(err)
        } 
    });
}