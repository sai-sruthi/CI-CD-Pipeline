const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
// const child = require('child_process');
const exec = require('child_process').exec;

const ssh = require('../lib/ssh');
const configuration = require('../pipeline/config-srv.json');
const configServerHost = `${configuration.user}@${configuration.ip}`;

exports.command = 'useful-tests';
exports.desc = 'Count number of failures from iTrust test suite and display most useful tests by number of times failed.';
exports.builder = yargs => {
    yargs.options({
      c: {
        describe: 'Number of times to run the iTrust test suite',
        type: 'int'
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
  const { c } = argv;

    (async () => {

        await run(c);

    })();

};

async function run(c) {

    // run iTrust test suite and display most useful tests

    console.log(chalk.blueBright('Removing previous useful test counts'));
    result = ssh('rm /bakerx/count.json', configServerHost);
    if( result.error ) { process.exit( result.status ); }

    for(var i = 0; i < c; i++){

      console.log(chalk.greenBright(`\nRun #${i+1}\n`))

      console.log(chalk.blueBright(`Fuzzing files`));
      result = ssh('sudo node /bakerx/fuzzer/fuzzer.js /var/lib/jenkins/jobs/iTrust/workspace/iTrust2/src/main/java', configServerHost);
      if( result.error ) { process.exit( result.status ); }

      console.log(chalk.blueBright(`Running test suite`));
      result = ssh('cd /var/lib/jenkins/jobs/iTrust/workspace/iTrust2; mvn clean test integration-test checkstyle:checkstyle', configServerHost);
      if( result.error ) { process.exit( result.status ); }

      console.log(chalk.blueBright('Adding test results to gathering struct'));
      result = ssh('sudo node /bakerx/fuzzer/count.js /var/lib/jenkins/jobs/iTrust/workspace/iTrust2/target/surefire-reports', configServerHost);
      if( result.error ) { process.exit( result.status ); }

      console.log(chalk.blueBright(`Resetting the iTrust repository`));
      result = ssh('cd /var/lib/jenkins/jobs/iTrust/workspace/iTrust2/; git reset --hard HEAD', configServerHost);
      if( result.error ) { process.exit( result.status ); }

    }

    console.log(chalk.blueBright('Pulling and sorting test results from most failures to least failures'));
    var count = JSON.parse(fs.readFileSync('count.json'));
    console.log(`# of Runs: ${c}`);

    function order(jsObj){
      var sortedArray = [];
      for(var i in jsObj)
      {
          sortedArray.push([jsObj[i], i]);
      }
      return sortedArray.sort(function(a,b){return a[0] - b[0]}).reverse();
  }
  
    console.log(order(count)); //{file:number}
}