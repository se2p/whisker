const {Command, InvalidArgumentError} = require('commander');
const util = require('./util')
// eslint-disable-next-line node/no-unpublished-require
const {version, description} = require('../package.json');
const {relativeToServantDir} = require("./util");

/**
 * The name of the Whisker subcommand that was invoked.
 *
 * @type {string}
 */
let subcommand = '';

/**
 * The command-line options given to servant.js, parsed as an object of key-value pairs.
 *
 * @type {Object.<string, unknown>}
 */
let opts = {};

/**
 * Whisker's main command.
 */
const whiskerCLI = new class extends Command {
    constructor() {
        super();

        const [nodePath, servantPath] = process.argv;
        const invocation = nodePath + ' ' + servantPath;

        this.name(invocation);
        this.version(version);
        this.description(description);
    }

    createCommand(name) {
        // Return a custom object that configures global options common to all Whisker subcommands.
        // Based on https://github.com/tj/commander.js/blob/master/examples/global-options.js
        return new WhiskerSubCommand(name);
    }
};

/**
 * Functions invoked at the end, to perform custom checks and validation of the command line options, and enforce other
 * constraints that cannot be easily modeled with Commander.
 *
 * @type {(() => void)[]}
 */
const customChecks = [];

/**
 * Represents a Whisker subcommand. It automatically configures global options common to all Whisker subcommands, and
 * also provides convenience functions to create CLI options that are frequently used but not common to all subcommands.
 */
class WhiskerSubCommand extends Command {
    constructor(name) {
        super(name);
        this._addCommonOptions();
    }

    _addCommonOptions() {
        this.option(
            '-a, --acceleration <Integer>',
            'acceleration factor',
            (factor) => util.processPositiveInt(factor),
            1);
        this.option(
            '-v, --csv-file <Path>',
            'create CSV file with results',
            (csvPath) => util.processFilePathNotExists(csvPath));
        this.option(
            '-z, --seed <String>',
            'custom seed for Scratch-VM');
        this.option(
            '-d, --headless',
            'run headless ("d" like in "decapitated")',
            false); // Has to be false, not undefined, as Puppeteer will not work properly otherwise.
        this.option('-k, --console-forwarded', 'forward browser console output');
        this.option('-l, --live-log', 'print new log output regularly');
        this.option('-o, --live-output-coverage', 'print new coverage output regularly');
    }

    // noinspection JSUnusedGlobalSymbols
    requireScratchPath() {
        return this.requiredOption(
            '-s, --scratch-path <Path>',
            'path to file (".sb3") or folder with scratch application(s)',
            (scratchPath) => util.processFileOrDirPathExists(scratchPath, '.sb3'),
        );
    }

    optionScratchPath() {
        return this.option(
            '-s, --scratch-path <Path>',
            'path to file (".sb3") or folder with scratch application(s)',
            (scratchPath) => util.processFileOrDirPathExists(scratchPath, '.sb3'),
        );
    }

    requireTestPath() {
        return this.requiredOption(
            '-t, --test-path <Path>',
            'path to Whisker tests to run (".js")',
            (testPath) => util.processFilePathExists(testPath, '.js'),
        );
    }

    optionTestPath() {
        return this.option(
            '-t, --test-path <Path>',
            'path to Whisker tests to run (".js")',
            (testPath) => util.processFilePathExists(testPath, '.js'),
        );
    }

    requireConfigPath() {
        return this.requiredOption(
            '-c, --config-path <Path>',
            'path to a configuration file (".json")',
            (configPath) => util.processFilePathExists(configPath, '.json'),
            relativeToServantDir('../config/mio.json'),
        );
    }

    optionNumberOfTabs() {
        return this.option(
            '-j, --number-of-jobs <Integer>',
            'number of jobs (Chromium tabs) for test execution',
            (numberTabs) => util.processNumberOfTabs(numberTabs),
            require('os').cpus().length
        );
    }

    optionMutators() {
        // Option can be used by specifying multiple arguments separated by spaces:
        //      -m ROR LOR AOR
        // Or by specifying the -m flag multiple times:
        //      -m ROR -m LOR -m AOR
        return this.option(
            '-m, --mutators <String...>',
            'mutation operators to apply',
            (mutator, mutators = []) => {
                if (!mutators.includes(mutator)) { // check if mutator already given to eliminate duplicates
                    mutators.push(util.processMutationOperator(mutator));
                }
                return mutators;
            });
    }

    optionMutantsDownloadPath() {
        customChecks.push(function mutantsDownloadPathImpliesMutators() {
            // Note: Option.implies(...) does not fit our use-case. So we have to implement a custom check here.
            if ('mutantsDownloadPath' in opts && !('mutators' in opts)) {
                throw new InvalidArgumentError('You gave a download path for mutants but did not enable mutators.');
            }
        });

        return this.option('-e, --mutants-download-path <Path>',
            'where generated mutants should be saved',
            (downloadPath) => util.processDirPathExists(downloadPath));
    }

    /**
     * This method must be invoked for every Whisker subcommand. It makes sure the global "mode" and "opts" variables
     * are set correctly when the respective subcommand is invoked.
     */
    register() {
        this.action((ignored, cmd) => {
            subcommand = this.name();
            opts = cmd.opts();
        });
    }
}

/*
 * Whisker's subcommands are configured below. Use the functions provided by the "./util.js" module to further process
 * and validate CLI arguments if needed, for example, to convert a string into a number, or to make sure a file exists.
 */

function newSubCommand(name) {
    return whiskerCLI.command(name);
}

// noinspection JSUnresolvedFunction
const subCommands = [
    newSubCommand('run')
        .description('run Whisker tests')
        .requireScratchPath()
        .requireTestPath()
        .optionNumberOfTabs()
        .optionMutators()
        .optionMutantsDownloadPath(),

    newSubCommand('generate')
        .description('generate Whisker test suites')
        .requireScratchPath()
        .requireConfigPath()
        .requiredOption(
            '-t, --test-download-dir <Path>',
            'path to directory for generated tests',
            (testDir) => util.processDirPathExists(testDir),
            __dirname)
        .option(
            '-r, --add-random-inputs <Integer>',
            'add random inputs to the test and wait the given number of seconds for its completion',
            (seconds) => util.processPositiveInt(seconds),
            10),

    newSubCommand('dynamic')
        .description('dynamic test suites using Neuroevolution')
        .requireScratchPath()
        .requireConfigPath()
        .requiredOption(
            '-t, --test-path <Path>',
            'directory path to store dynamic tests',
            (testPath) => util.processDirPathExists(testPath))
        .optionMutators()
        .optionMutantsDownloadPath(),

    newSubCommand('model')
        .description('test with model')
        .requireScratchPath()
        .requiredOption(
            '-p, --model-path <Path>',
            'model to test with',
            (modelPath) => util.processFilePathExists(modelPath))
        .requiredOption(
            '-r, --model-repetition <Integer>',
            'model test repetitions',
            (reps) => util.processPositiveInt(reps),
            1)
        .requiredOption(
            '-n, --model-duration <Integer>',
            'maximal time of one model test run in seconds',
            (duration) => util.processPositiveInt(duration),
            30)
        .optionTestPath()
        .option('-c, --model-case-sensitive', 'whether model test should test names case sensitive')
        .optionMutators()
        .optionMutantsDownloadPath(),

    newSubCommand('witness')
        .description('generate and replay error witnesses')
        .requireTestPath()
        .optionScratchPath()
        .optionNumberOfTabs()
        .requiredOption(
            '-w, --error-witness-path <Path>',
            'error witness to replay (".json")',
            (witnessPath) => util.processFilePathExists(witnessPath, '.json'))
        .option('-x, --generate-witness-only', 'generate error witness replay without executing it'),
];

// Common configuration for Whisker and all subcommands:
// (1) When showing help, sort subcommand and options alphabetically.
// (2) Treat excess arguments as error.
// (3) Do not allow unknown options.
[whiskerCLI, ...subCommands].forEach((cmd) => {
    cmd.configureHelp({
        sortSubcommands: true,
        sortOptions: true,
    });
    cmd.allowExcessArguments(false);
    cmd.allowUnknownOption(false);
});

// Finally, register all subcommands and parse the command line. This sets "mode" and "opts".
subCommands.forEach((cmd) => cmd.register());
whiskerCLI.parse(process.argv);

customChecks.forEach((check) => check());

opts = {
    ...opts,
    whiskerUrl: `file://${relativeToServantDir('../whisker-web/dist/index.html')}`
};

// The current Whisker mode (i.e., the name of the subcommand) and all given command line options are available in any
// JavaScript module by requiring the "cli.js" module.
module.exports = Object.freeze({
    subcommand,
    opts,
});
