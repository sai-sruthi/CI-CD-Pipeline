const chalk = require('chalk');
const configuration = require('../pipeline/config-srv.json');
const jenkins = require('jenkins')({ baseUrl: `http://${configuration.jenkinsUser}:${configuration.jenkinsPassword}@${configuration.ip}:${configuration.jenkinsPort}`, crumbIssuer: true, promisify: true });
const ssh = require('../lib/ssh');
const configServerHost = `${configuration.user}@${configuration.ip}`;

exports.command = 'build [job]';
exports.desc = 'trigger jenkins build job';
exports.builder = yargs => {
    yargs
    .positional('job', {
        descrbie: 'jenkins job name',
        default: 'checkbox.io'
    })
    .options({
        user: {
            alias: 'u',
            describe: 'user',
            default: configuration.jenkinsUser,
            type: 'string'
        },
        password: {
            alias: 'p',
            describe: 'password',
            default: configuration.jenkinsPassword,
            type: 'string'
        }
    });
};

exports.handler = async argv => {
    const { user, password, job } = argv;
    triggerJob(job);
};

/**
 * trigger pipeline job
 * wait for job to complete
 * print job log
 * @param {string} jobName 
 */
async function triggerJob(jobName) {
    console.log(chalk.blue(`Pipeline command triggered for jenkins job: ${jobName}`));

    const queueId = await jenkins.job.build(jobName).catch((error) => {
        throw error;
    });

    const buildId = await waitForBuildToStart(queueId);
    console.log(chalk.green(`jenkins build started ${buildId}`));

    const buildResult = await waitForBuildToComplete(jobName, buildId);
    console.log(chalk.green(`jenkins build complete ${buildResult}`));

    const buildLog = await jenkins.build.log({name: jobName, number: buildId});
    console.log(buildLog);
    
    console.log('Killing Chrome...');
    ssh('sudo pkill -9 chrome', configServerHost);
    
    console.log('Killing stray jetty processes...');
    ssh('fuser -k 9001/tcp', configServerHost);
}

/**
 * wait for build to finish and return status to caller
 * @param {string} jobName 
 * @param {number} buildId 
 * @returns {string} buildStatus
 */
async function waitForBuildToComplete(jobName, buildId) {
    console.log(chalk.blue(`waiting for build to complete`));
    const buildInfo = await jenkins.build.get({name: jobName, number: buildId});

    if(buildInfo.building) {
        return waitForBuildToComplete(jobName, buildId);
    }
    else {
        return buildInfo.result;
    }
}

/**
 * waiti for build to move from queue into executor
 * @param {number} queueId 
 * @returns {number} buildId
 */
async function waitForBuildToStart(queueId) {
    console.log(chalk.blue(`waiting for build to start`));
    const build = await jenkins.queue.item(queueId).catch((error) => {
        throw error;
    });
    if(build.executable) {
        return build.executable.number;
    }
    else {
       return waitForBuildToStart(queueId);
    }
}
