const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const waitssh = require('waitssh');

const bakerx = require('../lib/bakerx');
const ssh = require('../lib/ssh');
const scp = require('../lib/scp');

const configuration = require('../pipeline/config-srv.json');
const configServerHost = `${configuration.user}@${configuration.ip}`;

exports.command = 'setup';
exports.desc = 'Provision and configure a new development environment';
exports.builder = yargs => {
    yargs.options({
        force: {
            alias: 'f',
            describe: 'Force the old VM to be deleted when provisioning',
            default: false,
            type: 'boolean'
        },
        'gh-user': {
            alias: 'ghu',
            describe: 'github user',
            default: configuration.gitHubUser,
            type: 'string'
        },
        'gh-pass': {
            alias: 'ghp',
            describe: 'github password',
            default: configuration.gitHubPassword,
            type: 'string'
        }
    });
};



exports.handler = async argv => {
    const { force } = argv;

    (async () => {
        await setup(force);
    })();
};

async function setup(force)
{
    
    // We will use the image we've pulled down with bakerx.
    let image = path.join(os.homedir(), '.bakerx', '.persist', 'images', configuration.image, 'box.ovf');

    if(force)
    {
        console.log(chalk.red(`Deleting running vm instance`));
        await bakerx.execute("delete", `vm ${configuration.name}`).catch(e => e);
    }

    if(!fs.existsSync(image))
    {
        console.log(chalk.red(`Could not find ${configuration.image}. Pulling focal image with 'bakerx pull ${configuration.image} cloud-images.ubuntu.com'.`));
        await bakerx.execute("pull", `${configuration.image} cloud-images.ubuntu.com`).catch(e => e);
    }

    console.log(chalk.yellow(`Bringing up machine ${configuration.name}`));
    await bakerx.execute("run", `${configuration.name} ${configuration.image} --ip ${configuration.ip} --memory ${configuration.memory} --sync`).catch(e => e);
    
    // Explicit wait for boot
    let sshInfo = {port: configuration.sshPort, hostname: configuration.ip}
    try {
        console.log(`Waiting for ssh to be ready on ${configuration.ip}:${configuration.sshPort}`);        
        await waitssh(sshInfo);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }    
    console.log(`ssh is ready`);
    
    // Run your post-configuration customizations for the Virtual Machine.
    await postconfiguration();
}

async function postconfiguration(name) 
{
    console.log(chalk.yellow(`Running post-configurations`));
    await installAnsible();
    await copyVaultPasswordFile();
    await verifyAnsible();
    await configureServer();
}

/**
 * install ansible on config-srv vm
 */
async function installAnsible() {
    console.log(chalk.blue(`Installing Ansible.`));
    await ssh('sudo apt-get update', configServerHost);
    await ssh('sudo apt install python3-pip -y', configServerHost);
	await ssh('sudo pip3 install ansible', configServerHost);   
    console.log(chalk.blue(`Ansible Installed.`));
}

/**
 * verify ansible install with ping module
 */
async function verifyAnsible() {
    console.log(chalk.blue(`Verifying Ansible.`));
    await ssh(`ansible localhost -m ping -i ${configuration.ansibleInventory}`, configServerHost);
}


async function configureServer() {

    console.log(chalk.blueBright('Setting up Jenkins and Environment for iTrust and Checkbox.io'));
    const argv = require('yargs/yargs')(process.argv.slice(2))
    .command('$0', 'the default command', () => {}, (argv) => {
        console.log('this command will be run by default')
    }).argv
    let result = ssh(`sudo ansible-playbook /bakerx/pipeline/playbook.yml -i ${configuration.ansibleInventory} -e gitHubUser=${argv.ghUser} -e gitHubPassword=${argv.ghPass}`, configServerHost);
    if( result.error ) { 
        console.log(result.error); 
        process.exit( result.status ); 
    }
}

/**
 * This command should copy a .vault-pass file from the host to VM home directory.
 */
async function copyVaultPasswordFile() {
    console.log(chalk.blue('copying .vault-pass to VM home directory'));

    const vault = ".vault-pass";
    const srcPath = path.join(__dirname, "../"); // the vault file is located in the root of the project
    const vaultFile = `${srcPath}${vault}`
    const destination = `vagrant@192.168.33.20:~/${vault}`; // home directory of the virtual machine

    console.log(chalk.blue(`.vault-pass src: ${vaultFile}`));

    await scp(vaultFile, destination); // initiate secure copy
}


