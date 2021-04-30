const chalk = require('chalk');
const path = require('path');
const configuration = require('../../local-env.json');
const sshSync = require('../lib/ssh');
const scpSync = require('../lib/scp');


const BLUE = configuration.blue.ip;
const GREEN = configuration.green.ip;

const port = 22; // default ssh port

exports.command = 'push';
exports.desc = 'Install and update monitoring agent running on servers';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    const {} = argv;

    (async () => {

        await run( );

    })();

};

async function run() {

    console.log(chalk.greenBright('Pushing monitoring agent to servers...'));

    let agentJS = path.join(__dirname, '../../agent/index.js');
    let package = path.join(__dirname, '../../agent/package.json');

    // Blue Green servers to be monitored
    let servers = {'blue-srv':BLUE, 'green-srv':GREEN};

    for( let key in servers )
    {
        console.log(chalk.keyword('pink')(`Updated agent on server: ${key}`));
        
        // push agent/index.js
        result = scpSync (port, agentJS, `vagrant@${servers[key]}:/tmp/agent.js`);
        if( result.error ) { console.log(result.error); process.exit( result.status ); }
        // push agent/package.json
        result = scpSync (port, package, `vagrant@${servers[key]}:/tmp/package.json`);
        if( result.error ) { console.log(result.error); process.exit( result.status ); }

        // Install packages and start forever process on all servers to be monitored.
        if( process.platform=='win32')
            result = sshSync(`"cd /tmp && npm install && forever stopall && forever start agent.js ${key}"`, `vagrant@${servers[key]}`, port);
        else
        {
            result = sshSync(`'cd /tmp && npm install && forever stopall && forever start agent.js ${key}'`, `vagrant@${servers[key]}`, port);
        }
        if( result.error ) { console.log(result.error); process.exit( result.status ); }
    }
}

module.exports.run = run;
