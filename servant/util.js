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

const validateCommandLineArguments = commander => {
    const noOptionsGiven = commander.rawArgs.length < 3;
    if (noOptionsGiven) {
        commander.help();
    }
    const options = commander._optionValues
    if (!options.scratchPath && !options.isGenerateWitnessTestOnly) {
        logger.error('No path to a Scratch file was given, please use the -s option');
        process.exit(1);
    }

    if (!options.testPath && !options.generateTests && !options.modelPath) {
        logger.error('Missing testing mode argument. Please use the -t option for a test suite, -m option for ' +
            'model tests, or -g option for test generation.');
        process.exit(1);
    }

    if (options.numberOfTabs > os.cpus().length) {
        logger.error(`You selected to parallelize the tests in ${options.numberOfTabs} tabs, while only having ` +
            `${os.cpus().length} threads / CPUs available. Please do not use more than ${os.cpus().length}, as ` +
            `otherwise tests might fail and will need longer to initialize.`);
        process.exit(1);
    }
};

// Defines the CLI of the runner, including checks and defaults.
const cli = {
    start: () => {
        commander
            .option('-u, --whiskerURL <URL>', 'File URL of the Whisker instance to run the tests', '../whisker-web/dist/index.html')
            .option('-s, --scratchPath <Path>', 'Scratch application to run, or directory containing results', false)
            .option('-t, --testPath <Path>', 'Tests to run', false)
            .option('-m, --modelPath <Path>', 'Model to test with', false)
            .option('-mr, --modelRepetition <Integer>', 'Model test repetitions. Ignored if a test suite is specified.', "1")
            .option('-mt, --modelDuration <Integer>', 'Maximal time of one model test run in seconds', "30")
            .option('-mcs, --modelCaseSensitive <Boolean>', 'Whether model test should test names case sensitive', false)
            .option('-mu, --mutators <String>', 'Defines the mutation operators in case mutation testing should be applied', '')
            .option('-md, --mutantsDownloadPath <Path>', 'Defines where and if the generated mutants should be saved', false)
            .option('-w, --errorWitnessPath <Path>', 'A JSON error witness to replay', false)
            .option('-z, --isGenerateWitnessTestOnly', 'Generate test file with error witness replay without executing it', false)
            .option('-r, --addRandomInputs [Integer]', 'If random inputs should be added to the test and how many seconds to wait for its completion')
            .option('-a, --accelerationFactor <Integer>', 'Acceleration factor', 1)
            .option('-v, --csvFile <Path>', 'Name of CSV File to put output into (scratchPath must be a directory)', false)
            .option('-c, --configPath <Path>', 'Path to a configuration file', '../config/mio.json')
            .option('-d, --isHeadless', 'If should run headless (d like in decapitated)')
            .option('-p, --numberOfTabs <Integer>', 'The number of tabs to execute the tests in', "1")
            .option('-k, --isConsoleForwarded', 'If the browser\'s console output should be forwarded', false)
            .option('-o, --isLiveOutputCoverage', 'If new output of the coverage should be printed regularly', false)
            .option('-l, --isLiveLogEnabled', 'If the new output of the log should be printed regularly', false)
            .option('-g, --generateTests [Path]', 'If new tests should be generated and where to put them', false)
            .option('-at --activationTraceRepetitions <Integer>', 'Sets the number of activation trace records that should be recorded on a sample solution')
            .option('-se, --seed <Integer>', 'Seeds the Scratch-VM using the specified integer');

        commander.parse(process.argv);

        const {
            whiskerURL,
            scratchPath,
            testPath,
            modelPath,
            modelRepetition,
            modelDuration,
            modelCaseSensitive,
            mutators,
            mutantsDownloadPath,
            errorWitnessPath,
            isGenerateWitnessTestOnly,
            addRandomInputs,
            accelerationFactor,
            csvFile,
            configPath,
            isHeadless,
            numberOfTabs,
            isConsoleForwarded,
            isLiveOutputCoverage,
            isLiveLogEnabled,
            generateTests,
            activationTraceRepetitions,
            seed
        } = commander._optionValues;

        validateCommandLineArguments(commander);

        return {
            whiskerURL: `file://${path.resolve(whiskerURL)}`,
            scratchPath,
            testPath,
            modelPath,
            modelRepetition,
            modelDuration,
            modelCaseSensitive,
            errorWitnessPath,
            mutators,
            mutantsDownloadPath,
            isGenerateWitnessTestOnly,
            addRandomInputs,
            accelerationFactor,
            csvFile,
            configPath,
            isHeadless,
            numberOfTabs,
            isConsoleForwarded,
            isLiveOutputCoverage,
            isLiveLogEnabled,
            generateTests,
            activationTraceRepetitions,
            seed
        };
    }
};

module.exports = {logger, cli};
