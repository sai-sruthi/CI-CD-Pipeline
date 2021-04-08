const fs = require("fs");
const xml2js = require("xml2js");
const child = require("child_process");
const fuzzer = require("./fuzzer");
const Bluebird = require("bluebird");
const path = require("path");

const ITRUST2_V8 = "iTrust2-v8";
const ITRUST2 = "iTrust2";

const ITRUST_RELATIVE_PATH =
  "iTrust2-v8/iTrust2/src/main/java/edu/ncsu/csc/iTrust2";
const LOCALPATH = "/home/vagrant";
const TEST_REPORT = "/home/vagrant/iTrust2-v8/iTrust2/target/surefire-reports";

const GITPATH = `${LOCALPATH}/${ITRUST2_V8}/${ITRUST2}`;

var parser = new xml2js.Parser();
var validFileExtensions = ["xml"];
var map = {};
var numberOfIterations = process.argv.slice(2)[0];

const read = (dir) =>
  fs.readdirSync(dir).reduce(function (files, file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      var readFilesList = read(path.join(dir, file));
      if (readFilesList != undefined) {
        return files.concat(readFilesList);
      } else {
        return files;
      }
    } else {
      if (
        validFileExtensions.indexOf(file.substring(file.lastIndexOf(".") + 1)) >
        -1
      ) {
        return files.concat(path.join(dir, file));
      } else {
        return files;
      }
    }
  }, []);

if (process.env.NODE_ENV != "test") {
  console.log(calculatePriority(numberOfIterations));
  console.log(map);
}

function readResults(result) {
  var tests = [];
  for (var i = 0; i < result.testsuite["$"].tests; i++) {
    var testcase = result.testsuite.testcase[i];
    tests.push({
      name: testcase["$"].classname + testcase["$"].name,
      time: testcase["$"].time,
      status: testcase.hasOwnProperty("failure") ? "failed" : "passed",
    });
  }
  return tests;
}

async function calculatePriority(numberOfIterations) {
//   child.execSync(
//     `cd /home/vagrant/iTrust2-v8/iTrust2 && sudo mvn -f pom.xml process-test-classes`
//   );
  for (var i = 0; i < numberOfIterations; i++) {
    var maxRetries = 5;

    while (maxRetries > 0) {
      var flag = 0;
      console.log(`trying ${maxRetries}`);
      try {
        fuzzer.main(LOCALPATH + "/" + ITRUST_RELATIVE_PATH);
        child.execSync(
          `cd /home/vagrant/iTrust2-v8/iTrust2 && sudo mvn clean test checkstyle:checkstyle`
        );
      } catch (e) {
        console.log("exception occured");
        console.log(e);
      }
      console.log(`successfull build: ${i}`);
      // reset the repo
      child.execSync(`cd ${GITPATH} && sudo git reset --hard HEAD`);
      if (flag == 0) {
        break;
      }
    }

    var listOfFiles = read(TEST_REPORT);
    //console.log(listOfFiles);
    for (const index in listOfFiles) {
      var contents = fs.readFileSync(listOfFiles[index]);
      let xml2json = await Bluebird.fromCallback((cb) =>
        parser.parseString(contents, cb)
      );
      var tests = readResults(xml2json);
      //tests.forEach( e=> console.log(e));
      //return tests;
      for (var test of tests) {
        console.log(test);
        if (!map.hasOwnProperty(test.name)) {
          map[test.name] = { pass: 0, fail: 0 };
        }
        if (test.status == "passed") {
          map[test.name].pass++;
        }
        if (test.status == "failed") {
          map[test.name].fail++;
        }
      }
    }
    console.log(map);

    // delete the surefire-reports for previous iteration
    child.execSync(
      `cd ${TEST_REPORT} && sudo rm -rf *.xml && mysql -u root -e 'DROP DATABASE IF EXISTS iTrust2'`
    );
  }

  result = [];

  for (key in map) {
    console.log(key);
    result.push({
      name: key,
      pass: map[key].pass,
      fail: map[key].fail,
      total: map[key].pass + map[key].fail,
    });
  }

  result.sort((a, b) => {
    if (a.fail > b.fail) return -1000;
    else if (a.pass < b.pass && a.fail == b.fail) return -1000;
  });

  var str = "";

  for (i in result) {
    str += `${result[i].fail}/${numberOfIterations} ${result[i].name}` + "\n";
  }

  let data = JSON.stringify(map);
  fs.writeFileSync("map.json", data);
  fs.writeFile("/home/vagrant/result.txt", str, (err) => {
    if (err) throw err;

    // success case, the file was saved
    console.log("result saved!");
  });

  return;
}

module.exports.calculatePriority = calculatePriority;