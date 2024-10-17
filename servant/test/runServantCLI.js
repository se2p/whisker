const exec = require('child_process').exec;
const {relativeToServantDir} = require('../src/util');

/**
 * Runs a headless servant with the provided arguments.
 * @param args the arguments to run the servant with, starting with the subcommand
 * @returns {Promise<object>} an object containing error, stdout and stderr
 */
async function runServantCLI(args) {
    return new Promise(resolve => {
        const command = `node servant ${args.join(' ')} --headless`;
        const projectRoot = relativeToServantDir('..');

        exec(command, {cwd: projectRoot},
            (error, stdout, stderr) => {
                resolve({error, stdout, stderr});
            });
    })
}

module.exports = runServantCLI;
