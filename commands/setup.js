const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const waitssh = require('waitssh');

const bakerx = require('../lib/bakerx');
const ssh = require('../lib/ssh');
const scp = require('../lib/scp');

const configuration = require('../cm/config-srv.json');
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
    console.log(chalk.yellow(`Bringing up machine ${configuration.name}`));

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

    await bakerx.execute("run", `${configuration.name} ${configuration.image} --ip ${configuration.ip} --sync`).catch(e => e);
    
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
    await copyAnsibleInventory();
    await copyVaultPasswordFile();

    await verifyAnsible();
    await installJenkins();

}

/**
 * install ansible on config-srv vm
 */
async function installAnsible() {
    console.log(chalk.blue(`Installing Ansible.`));
    await ssh('sudo add-apt-repository ppa:ansible/ansible', configServerHost);
    await ssh('sudo apt-get update', configServerHost);
	await ssh('sudo apt-get install ansible -y', configServerHost);   
    console.log(chalk.blue(`Ansible Installed.`));
}

/**
 * verify ansible install with ping module
 */
async function verifyAnsible() {
    await ssh(`ansible localhost -m ping -i ${configuration.ansibleInventory}`, configServerHost);
}


async function installJenkins() {
    await ssh(`ansible localhost -m ping -i ${configuration.ansibleInventory}`, configServerHost);
}

/**
 * This command will copy the ansible inventory to the home directory of the VM
 */
async function copyAnsibleInventory() 
{
    console.log(chalk.blue('copying ansible inventory to VM home directory'));

    const srcPath = path.join(__dirname, "../cm/"); // the vault file is located in the root of the project
    const inventoryFile = `${srcPath}${configuration.ansibleInventory}`
    const destination = `${configServerHost}:~/${configuration.ansibleInventory}`; // home directory of the virtual machine

    console.log(chalk.blue(`inventory src: ${inventoryFile}`));

    await scp(inventoryFile, destination); // initiate secure copy
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
