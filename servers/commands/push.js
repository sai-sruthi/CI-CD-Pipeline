
const child = require('child_process');
const chalk = require('chalk');
const path = require('path');

const sshSync = require('../../lib/ssh');
const scpSync = require('../../lib/scp');
const VBox = require('../lib/VBoxManage');

const configuration = require('../../local-env.json');
const blue = configuration.blue;
const green = configuration.green;

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

    let servers = [blue,green];
    for( let server of servers )
    {
         let port=22;

        console.log(chalk.keyword('pink')(`Updated agent on server: ${server.name}`));
        // agent/index.js
        result = scpSync (agentJS, `${server.user}@${server.ip}:~/agent.js`);
        if( result.error ) { console.log(result.error); process.exit( result.status ); }

        // agent/package.json
        result = scpSync (package, `${server.user}@${server.ip}:~/package.json`);
        if( result.error ) { console.log(result.error); process.exit( result.status ); }

        if( process.platform=='win32')
            result = sshSync(`"npm install && forever stopall && forever start agent.js ${server.name}"`, `${server.user}@${server.ip}`, port);
        else
        {
            result = sshSync(`'npm install && forever stopall && forever start agent.js ${server.name}'`, `${server.user}@${server.ip}`, port);
        }
        if( result.error ) { console.log(result.error); process.exit( result.status ); } 
    }
}


module.exports.run = run;
