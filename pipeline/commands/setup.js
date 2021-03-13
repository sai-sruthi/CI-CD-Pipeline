const chalk = require('chalk');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');
const waitssh = require('waitssh');

const bakerx = require('../lib/bakerx');
const ssh = require('../lib/ssh');

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
    // Use current working directory to derive name of virtual machine
    let cwd = process.cwd().replace(/[/]/g,"-").replace(/\\/g,"-");
    let name = `config-srv`;    
    console.log(chalk.keyword('pink')(`Bringing up machine ${name}`));

    // We will use the image we've pulled down with bakerx.
    let image = path.join(os.homedir(), '.bakerx', '.persist', 'images', 'focal', 'box.ovf');
    let image_name = 'focal'

    if(force)
    {
        console.log(chalk.red(`Deleting running vm instance`));
        await bakerx.execute("delete", `vm ${name}`).catch(e => e);
    }


    if(!fs.existsSync(image))
    {
        console.log(chalk.red(`Could not find ${image_name}. Pulling focal image with 'bakerx pull ${image_name} cloud-images.ubuntu.com'.`));
        await bakerx.execute("pull", `${image_name} cloud-images.ubuntu.com`).catch(e => e);
    }

    await bakerx.execute("run", `${name} ${image_name} --ip 192.168.33.20 --sync`).catch(e => e);
 

    // Explicit wait for boot
    let sshInfo = {port: 22, hostname: '192.168.33.20'}
    try {
        console.log(`Waiting for ssh to be ready on 192.168.33.20:22..`);        
        await waitssh(sshInfo);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }    
    console.log(`ssh is ready`);
    
    // Run your post-configuration customizations for the Virtual Machine.
    await postconfiguration();

    //await createInventory();

}

async function postconfiguration(name) 
{
    console.log(chalk.keyword('pink')(`Running post-configurations...`));
    console.log(chalk.keyword('pink')(`Installing Ansible...`));
    await ssh('mkdir help');
    await ssh('sudo mount -t vboxsf');
    await ssh('sudo mount -t vboxsf vbox-share-0 ~/help/');
    await ssh('sudo add-apt-repository ppa:ansible/ansible');
    await ssh('sudo apt-get update');
	await ssh('sudo apt-get install ansible -y');   
    console.log(chalk.keyword('pink')(`Ansible Installed...`));
    await ssh('ansible localhost -m ping -i inventory');

}


async function createInventory(name) 
{
    await ssh(`sudo cat << EOF > ~/vagrant/inventory.ini
        [localhost]
        localhost ansible_ssh_user=vagrant 
        [localhost:vars]
        ansible_ssh_common_args='-o StrictHostKeyChecking=no'  
        EOF`);
    await ssh('ansible localhost -m ping -i inventory');
}
