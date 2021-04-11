const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const ssh = require("../lib/ssh");

const configuration = require('../pipeline/config-srv.json');
const configServerHost = `${configuration.user}@${configuration.ip}`;

exports.command = "useful-tests";
exports.desc = "Test the package";
exports.builder = (yargs) => {
  yargs.options({
    check: {
      alias: "c",
      describe: "numbers of times to execute test suite",
      default: 1,
      type: "number",
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

exports.handler = async (argv) => {
  var { check, ghUser, ghPass} = argv;
  if (check == null) {
    check = 1;
  }
  (async () => {
    if (fs.existsSync(path.resolve("pipeline/iTrust_test.yml"))) {
      await run(check, ghUser, ghPass);
    } else {
      console.error("Sorry, File doesn't exist");
    }
  })();
};

async function run(check, ghUser, ghPass) {
  let filePath = "/bakerx/pipeline/iTrust_test.yml";
  console.log(chalk.blueBright(`Running tests ${check} time(s)...`));
  const argv = require('yargs/yargs')(process.argv.slice(3))

  console.log(`${ghUser}`);
  let result = ssh(
    `sudo ansible-playbook ${filePath} -i ${configuration.ansibleInventory} -e gitHubUser=${ghUser} -e gitHubPassword=${ghPass} -e check=${check}`, configServerHost);
  if (result.error) {
    process.exit(result.status);
  }
  for(var i = 0; i < check; i++){

    console.log(chalk.greenBright(`\nRun #${i+1}\n`))
    filePath = "/bakerx/pipeline/iTrustMutate.yml"
    result = ssh(
    `sudo ansible-playbook ${filePath} -i ${configuration.ansibleInventory}`, configServerHost);
  if (result.error) {
    process.exit(result.status);
  } 
  }

  console.log(chalk.blueBright('Pulling and sorting test results from most failures to least failures'));
    var count = JSON.parse(fs.readFileSync('count.json'));
    console.log(`# of Runs: ${check}`);

    function order(jsObj){
      var sortedArray = [];
      var overall = 0;
      var index = 0;
      for(var i in jsObj)
      {
          sortedArray.push([jsObj[i], i]);
          overall +=jsObj[i];
          index += 1;
      }

      console.log("Overall Test Mutations are " + overall+"/"+(index*100));

      return sortedArray.sort(function(a,b){return a[0] - b[0]}).reverse();
  }

;
    console.log(order(count)); //{file:number}

}