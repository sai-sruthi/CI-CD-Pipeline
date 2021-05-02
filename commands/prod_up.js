const child = require('child_process');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const got    = require("got");

const fs = require('fs');
const sshpk = require('sshpk');

const ssh = require('../lib/ssh');
const scp = require('../lib/scp');

const configuration = require('../pipeline/config-srv.json');
const configServerHost = `${configuration.user}@${configuration.ip}`

// api token for rest calls
var config = {};

// ssh key to ssh into vms
var ssh_key_fingerprint;

// header to use our token when making REST api requests
var headers;

var checkboxIp;
var itrustIp;
var monitorIp;

var dropletId;

var ipsAdded = 0;

exports.command = 'prod up';
exports.desc = 'Provision the cloud instances';
exports.builder = yargs => {
    yargs.options({
    });
};


exports.handler = async argv => {
    const { } = argv;

    (async () => {

        await run( );

    })();

};

class DigitalOceanProvider
{
	async createSSHKey(){

	console.log(chalk.blue('copying .id_rsa.pub to VM home directory'));

    const sshPublicKey = ".ssh/id_rsa.pub";
	const sshfolder = ".id_rsa.pub"
    const destPath = path.join(__dirname, "../"); // the vault file is located in the root of the project
    const sshPublicKeyFile = `${destPath}${sshfolder}`
    const src = `vagrant@192.168.33.20:~/${sshPublicKey}`; // home directory of the virtual machine

   	await ssh('sudo cat /home/vagrant/.ssh/id_rsa.pub', configServerHost);
 
    await scp(src, sshPublicKeyFile); // initiate secure copy


	/* Read in an OpenSSH-format public key */
	var keyPub = fs.readFileSync('.id_rsa.pub');
	var key = sshpk.parseKey(keyPub, 'ssh');
	key =key.toBuffer('ssh').toString();

	//console.log(key);

	var body = 
		{
            "name": "My SSH Public Key",
			"public_key":key 
		};

		console.log("Attempting to create SSH Key: "+ JSON.stringify(body) );

		let response = await got.post("https://api.digitalocean.com/v2/account/keys", 
		{
			headers:headers,
			json: body
		}).catch( err => 
			console.error(chalk.red(`createSSHKey: ${err}`)) 
		);

		if( !response ) return;

		// console.log(response.statusCode);
		// console.log(response.body);

		if(response.statusCode == 201)
		{
			ssh_key_fingerprint = JSON.parse( response.body ).ssh_key.fingerprint;
			console.log(chalk.green(`Created ssh key ${ssh_key_fingerprint}`));
		}
	}
	async createDroplet (dropletName, region, imageName )
	{
		if( dropletName == "" || region == "" || imageName == "" )
		{
			console.log( chalk.red("You must provide non-empty parameters for createDroplet!") );
			return;
		}

		var data = 
		{
            "name": dropletName,
			"region":region,
			"size":"s-1vcpu-1gb",
			"image":imageName,
			"ssh_keys":[ssh_key_fingerprint],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		let response = await got.post("https://api.digitalocean.com/v2/droplets", 
		{
			headers:headers,
			json: data
		}).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`)) 
		);

		if( !response ) return;

		// console.log(response.statusCode);
		// console.log(response.body);

		if(response.statusCode == 202)
		{
			dropletId = JSON.parse( response.body ).droplet.id;
			console.log(chalk.green(`Created droplet id ${dropletId}`));
			await this.dropletInfo(dropletName, dropletId);
		}
	}

	async dropletInfo (name, id)
	{

		var ip;

		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		var ping = setInterval(async function(){
			let response = await got(`https://api.digitalocean.com/v2/droplets/${id}`, { headers: headers, responseType: 'json' })
		.catch(err => console.error(`listImages ${err}`));

		if( !response ) return;

		if( response.body.droplet )
		{
			let droplet = response.body.droplet;

			if(droplet.status == "active"){

				console.log(`${name} VM active`);
				
				// Print out IP address
				ip = droplet.networks.v4[1].ip_address
				console.log(`IP Address: ${ip}`);

				if(name == "checkbox.io"){
					checkboxIp = ip;
					ipsAdded++;
					addHostToInventory("checkbox", ip);
				}else if(name == "iTrust"){
					itrustIp = ip;
					ipsAdded++;
					addHostToInventory("itrust", ip);
				}else if(name == "monitor"){
					monitorIp = ip;
					ipsAdded++;
					addHostToInventory("monitor", ip);
				}

				clearInterval(ping);
			}
		}

		}, 5000);

	}

	async deleteDroplet(id)
	{
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// HINT, use the DELETE verb.

		let response = await got.delete('https://api.digitalocean.com/v2/droplets/' + id, { headers: headers, json:true })
							.catch(err => console.error(`dropletDelete ${err}`));

		if( !response ) return;

		// No response body will be sent back, but the response code will indicate success.
		// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
		if(response.statusCode == 204)
		{
			console.log(`Deleted droplet ${id}`);
		}

	}

};


async function provision()
{
	let client = new DigitalOceanProvider();

    var checkbox = "checkbox.io";
    var itrust = "iTrust";
    var monitor = "monitor";
	var region = "nyc3";
    var image = "ubuntu-20-04-x64"; 

	await client.createSSHKey();

	await client.createDroplet(checkbox, region, image);

	await client.createDroplet(itrust, region, image);

	await client.createDroplet(monitor, region, image);

}


async function run() {

	fs.copyFileSync('pipeline/inventory', 'pipeline/cloud_inventory.ini');

	console.log(chalk.greenBright('Prod cloud server!'));
	// Retrieve our api token from the environment variables.
	config.token = process.env.DIGITAL_OCEAN_API_KEY;
	
	if( !config.token )
	{
		console.log(chalk`{red.bold DIGITAL_OCEAN_API_KEY is not defined!}`);
		console.log(`Please set your environment variables with appropriate token.`);
		console.log(chalk`{italic You may need to refresh your shell in order for your changes to take place.}`);
		process.exit(1);
	}

	console.log(chalk.green(`Your token is: ${config.token.substring(0,4)}...`));

	// Configure our header
	headers =
	{
		'Content-Type':'application/json',
		Authorization: 'Bearer ' + config.token
	};

	await provision();
}


function addHostToInventory(name, ip, user='root'){

	var inventory = 
`[${name}]
${ip}    ansible_ssh_private_key_file=/home/vagrant/.ssh/id_rsa    ansible_user=${user}

[${name}:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
					 
`;

	fs.appendFile('pipeline/cloud_inventory.ini', inventory, function (err) {
		if (err) throw err;
		console.log(`Added IP Address for ${name} to inventory file`);
	});
}