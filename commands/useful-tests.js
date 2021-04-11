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
  console.log(chalk.blueBright(`Running tests suite ${check} time(s)...`));
  const argv = require('yargs/yargs')(process.argv.slice(3));
  
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

  console.log(chalk.yellowBright('Sorting test results from most failures to least failures'));
    var count = JSON.parse(fs.readFileSync('count.json'));
    console.log(chalk.greenBright(`No of Runs of Test Suite are : ${check}`));

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

      var mutation =( overall * 100) / (index*check);

      console.log(chalk.greenBright("Overall Test Mutations for "+ check +" runs of test suite is : "+ overall+"/"+(index*check) + " - "+mutation+"%"));

      return sortedArray.sort(function(a,b){return a[0] - b[0]}).reverse();
  }

;
   count = order(count); //{file:number}
   for(var i in count)
   {
       console.log(chalk.yellowBright(count[i][0]+"/"+check+" , "+count[i][1]));
   } 

}