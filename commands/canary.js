const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const waitssh = require('waitssh');

const bakerx = require('../lib/bakerx');
const ssh = require('../lib/ssh');
const scp = require('../lib/scp');

const configuration = require('../pipeline/local-env.json');
const blue = configuration.blue;
const green = configuration.green;
const proxy = configuration.proxy;



const child = require('child_process');
async function execute(command) {
    const exec = require('child_process').exec
  
    exec(command, (err, stdout, stderr) => {
      process.stdout.write(stdout)
    })
}


// const scpSync = require('../lib/scp');
// const sshSync = require('../lib/ssh');

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
    await prodSetup(blue);
    await prodSetup(green);
    //await pushToProd(proxy);
    //await proxySetup();
    //await canary();

}

async function provision(){
    console.log(chalk.greenBright('Setting up computing environment!'));

    let image = path.join(os.homedir(), '.bakerx', '.persist', 'images', 'focal', 'box.ovf');

    if(!fs.existsSync(image))
    {
        console.log(chalk.red(`Could not find focal. Pulling focal image with 'bakerx pull focal cloud-images.ubuntu.com'.`));
        await bakerx.execute("pull", `focal cloud-images.ubuntu.com`).catch(e => e);
    }

    console.log(chalk.blueBright('Provisioning blue server...'));
    let result = child.spawnSync(`bakerx`, `run blue focal -m 1024 --ip 192.168.44.50`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    console.log(chalk.blueBright('Provisioning green server...'));
    result = child.spawnSync(`bakerx`, `run green focal -m 1024 --ip 192.168.44.60`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

    console.log(chalk.blueBright('Provisioning proxy server...'));
    result = child.spawnSync(`bakerx`, `run proxy focal -m 512 --ip 192.168.44.70`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }
}

async function prodSetup(site){
    host = `${site.user}@${site.ip}`;
    hostName = site.name;
    console.log(chalk.blue(`Installing nodejs, npm, git`));
    await ssh('sudo apt-get update', host);
    await ssh('sudo apt-get install -y nodejs', host);
	await ssh('sudo apt-get install -y npm', host);
	await ssh('sudo apt-get install -y git', host);
    await ssh(`mkdir -p checkpoint.io/${hostName}.git checkpoint.io/www`,host)
    await ssh(`cd ~/checkpoint.io/${hostName}.git; git init --bare`, host);
    console.log(chalk.blue(`${hostName} env setup completed.`));
}

async function pushToProd(){
    console.log(chalk.blueBright('Cloning micro-service repo...'));
    //.split(' '), {shell:true, stdio: 'inherit'} 
    try {
        await execute(`git clone https://github.com/chrisparnin/checkbox.io-micro-preview.git`);
        process.chdir('/checkbox.io-micro-preview');
        await execute(`git remote add blue ssh://vagrant@192.168.44.50/home/vagrant/checkbox.io/blue.git`);
        await execute(`git remote add green ssh://vagrant@192.168.44.60/home/vagrant/checkbox.io/green.git`);
        await execute(`export GIT_SSH_COMMAND="ssh -i ~/.bakerx/insecure_private_key -o StrictHostKeyChecking=no"`);
        await execute(`git push green master`);
        await execute(`git push blue master`);
    }
    catch(err){ console.log(err.error); process.exit( err.status ); }
}