const path = require('path');
const os   = require('os');

const child = require('child_process');

let identifyFile = path.join(os.homedir(), '.bakerx', 'insecure_private_key');

/**
 * 
 * @param {string} src - source file which should be copied
 * @param {string} dest - destination where source should be copied
 * @returns {Promise}
 */
module.exports = function(src, dest) {
    
    let scpArgs = [];
    scpArgs.push(`-i`);
    scpArgs.push(`"${identifyFile}"`)
    scpArgs.push(`-o`);
    scpArgs.push(`StrictHostKeyChecking=no`);
    scpArgs.push(`-o`);
    scpArgs.push(`UserKnownHostsFile=/dev/null`);
    scpArgs.push(`"${src}"`);
    scpArgs.push(`"${dest}"`);        
    console.log(scpArgs);
    return child.spawnSync(`scp`, scpArgs, {stdio: 'inherit', shell: true});
}