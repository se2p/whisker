/* eslint-disable no-undef */
const os = require('os');
const chalk = require('chalk');
const commander = require('commander');
const path = require('path');

// Defines an interceptable and more "nice looking" logger based on elementary console calls
const logger = {
    info: (...args) => console.info(chalk.white.bgGreen.bold(' INFO: '), ...args),
    error: (...args) => console.error(chalk.white.bgRed.bold('\n ERRORS: \n'), ...args, '\n'),
    warn: (...args) => console.warn(chalk.white.bgYellow.bold('\n WARNING: \n'), ...args, '\n'),
    log: (...args) => console.log(...args),
    debug: (...args) => console.debug(chalk.white.bgBlue.bold(' DEBUG: '), ...args, '\n'),
    clear: () => console.clear()
};

// Defines the CLI interface of the runner, including checks and defaults.
const cli = {
    start: () => {
        commander
            .option('-u, --whiskerURL <URL>', 'File URL of the Whisker instance to run the tests', '../dist/index.html')
            .option('-s, --scratchPath <Path>', 'Scratch project to run', './project.sb3')
            .option('-t, --testPath <Path>', 'Tests to run', './tests.js')
            .option('-f, --frequency <Integer>', 'Refreshrate of scratch in hz', 30)
            .option('-d, --isHeadless', 'If should run headless (d like in decapitated)')
            .option('-p, --numberOfTabs <Integer>', 'The number of tabs to execute the tests in', 1)
            .option('-c, --isConsoleForwarded', 'If the browser\'s console output should be forwarded', false)
            .option('-o, --isLifeOutputCoverage', 'If the new output of the coverage should be printed regulary', false)
            .option('-l, --isLifeLogEnabled', 'If the new output of the log should be printed regulary', false);

        commander.parse(process.argv);

        const {
            whiskerURL,
            testPath,
            scratchPath,
            frequency,
            isHeadless,
            numberOfTabs,
            isConsoleForwarded,
            isLifeOutputCoverage,
            isLifeLogEnabled
        } = commander;

        if (numberOfTabs > os.cpus().length) {
            logger.error(`You selcted to parallelize the tests in ${numberOfTabs} tabs, while only having ` +
              `${os.cpus().length} threads / CPUs available. Please do not use more than ${os.cpus().length}, as` +
              `otherwise tests might fail and will need longer to initialize.`);
            return;
        }

        return {
            whiskerURL: `file://${path.resolve(whiskerURL)}`,
            testPath,
            scratchPath,
            frequency,
            isHeadless,
            numberOfTabs,
            isConsoleForwarded,
            isLifeOutputCoverage,
            isLifeLogEnabled
        };
    }
};

module.exports = {logger, cli};
