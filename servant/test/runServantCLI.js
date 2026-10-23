const exec = require('child_process').exec;
const {relativeToServantDir} = require('../src/util');

/**
 * Runs a headless servant with the provided arguments.
 * @param args the arguments to run the servant with, starting with the subcommand
 * @param timeout milliseconds after which the servant is killed. Should be lower than the Jest timeout of the calling
 *                test, otherwise a hanging servant outlives the test and keeps Jest from exiting.
 * @returns {Promise<object>} an object containing error, stdout and stderr
 */
async function runServantCLI(args, timeout = 18000) {
    return new Promise(resolve => {
        const command = `node servant ${args.join(' ')} --headless`;
        const projectRoot = relativeToServantDir('..');

        // SIGINT makes Puppeteer kill the (detached) browser process before the servant exits.
        exec(command, {cwd: projectRoot, timeout, killSignal: 'SIGINT'},
            (error, stdout, stderr) => {
                resolve({error, stdout, stderr});
            });
    })
}

module.exports = runServantCLI;
