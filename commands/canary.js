
const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const fs = require('fs');
const sshSync = require('../lib/ssh');
const scpSync = require('../lib/scp');
var agent_push = require('../servers/commands/push.js')
const VBox = require('../servers/lib/VBoxManage');

const configuration = require('../local-env.json');
const blue = configuration.blue;
const green = configuration.green;
const proxy = configuration.proxy;

exports.command = 'canary [brancha] [branchb]';
exports.desc = 'Setup environment and perform Canary analysis';
exports.builder = yargs => {
    yargs.positional('brancha', {
        descrbie: 'first branch name',
        type: 'string',
        default: 'master'
    }).positional('branchb', {
        descrbie: 'second branch name',
        type: 'string',
        default: 'broken'
    }).options({
        privateKey: {
            describe: 'Install the provided private key on the configuration server',
            type: 'string'
        }
    });
};


exports.handler = async argv => {
    const { privateKey, brancha, branchb } = argv;

    (async () => {

        await run( privateKey, brancha, branchb );       
 
    })();

};

async function run(privateKey, brancha, branchb) {
    await provision();
    await cloneBranch(blue, brancha);
    await cloneBranch(green, branchb);
    agent_push.run();
    await spawnForeverProcess(blue);
    await spawnForeverProcess(green);
    await startProxy();
}

async function provision() {

    let image = path.join(os.homedir(), '.bakerx', '.persist', 'images', 'queues', 'box.ovf');

    if(!fs.existsSync(image))
    {
        console.log(chalk.red(`Could not find queues. Pulling queues image with 'bakerx pull queues cloud-images.ubuntu.com'.`));
        await bakerx.execute("pull", `queues cloud-images.ubuntu.com`).catch(e => e);
    }

    
    console.log(chalk.greenBright('Provisioning blue...'));
    let result = child.spawnSync(`bakerx`, `run blue ${blue.img} --ip ${blue.ip} --sync --memory ${blue.memory}`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }
    
    
    
    console.log(chalk.greenBright('Provisioning green...'));
    result = child.spawnSync(`bakerx`, `run green ${green.img} --ip ${green.ip} --sync --memory ${green.memory}`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }
    
    

    console.log(chalk.greenBright('Provisioning Proxy...'));
    result = child.spawnSync(`bakerx`, `run proxy ${proxy.img} --ip ${proxy.ip} --sync --memory ${proxy.memory}`.split(' '), {shell:true, stdio: 'inherit'} );
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

}

async function cloneBranch(server, branch) {

    host = `${server.user}@${server.ip}`;
    console.log(chalk.greenBright(`Cloning checkbox.io micro-service ${branch} branch on ${server.name} vm`));
    
    let winCmd = `"if [ -d "checkbox.io-micro-preview" ]; then sudo rm -r "checkbox.io-micro-preview"; fi; git clone -b ${branch} https://github.com/chrisparnin/checkbox.io-micro-preview.git; sudo npm install forever -g"`
    let macCmd = `'if [ -d "checkbox.io-micro-preview" ]; then sudo rm -r "checkbox.io-micro-preview"; fi; git clone -b ${branch} https://github.com/chrisparnin/checkbox.io-micro-preview.git; sudo npm install forever -g'`
        
    let result = null;
    if( process.platform=='win32') {
        result = sshSync(winCmd, host);
    }

    else { result = sshSync(macCmd, host);}
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

}

async function spawnForeverProcess(server) {

    host = `${server.user}@${server.ip}`;
    console.log(chalk.greenBright(`Start checkbox.io micro-service on ${server.name} vm`));
    
    let winCmd = `"cd checkbox.io-micro-preview; npm install ; forever start index.js"`;
    let macCmd = `'cd checkbox.io-micro-preview; npm install ; forever start index.js'`;

    let result = null;
    if( process.platform=='win32') {
        result = sshSync(winCmd, host);
    }
    else { result = sshSync(macCmd, host);}
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

}


async function startProxy() {

    host = `${proxy.user}@${proxy.ip}`;
    console.log(chalk.greenBright(`Start canary on ${proxy.name} vm`));
    
    let winCmd = `"cd /bakerx/proxy; npm install --no-bin-links; node app.js"`;
    let macCmd = `'cd /bakerx/proxy; npm install --no-bin-links; node app.js'`;

    let result = null;
    if( process.platform=='win32') {
        result = sshSync(winCmd, host);
    }
    else { result = sshSync(macCmd, host);}
    if( result.error ) { console.log(result.error); process.exit( result.status ); }

}