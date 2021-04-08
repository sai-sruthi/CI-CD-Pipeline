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
  //let values  = JSON.stringify(argv);
  console.log(`${ghUser}`);
  let result = ssh(
    `sudo ansible-playbook ${filePath} -i ${configuration.ansibleInventory} -e gitHubUser=${ghUser} -e gitHubPassword=${ghPass} -e check=${check}`, configServerHost);
  if (result.error) {
    process.exit(result.status);
  }
}