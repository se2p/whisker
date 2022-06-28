const {Command} = require('commander');
const util = require('./util')
// eslint-disable-next-line node/no-unpublished-require
const {version, description} = require('../package.json');

/**
 * The name of the Whisker subcommand that was invoked.
 *
 * @type {string}
 */
let mode = '';

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
        this.allowExcessArguments(false);
    }

    createCommand(name) {
        // Return a custom object that configures global options common to all Whisker subcommands.
        // Based on https://github.com/tj/commander.js/blob/master/examples/global-options.js
        return new WhiskerSubCommand(name);
    }
};

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
        this.requiredOption(
            '-u, --whisker-url <Path>',
            'file URL to Whisker Web (".html")',
            (whiskerWeb) => {
                const filePath = util.processFilePathExists(whiskerWeb, '.html');
                return `file://${filePath}`;
            },
            '../whisker-web/dist/index.html');
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
            '-z, --seed <Integer>',
            'seed Scratch-VM with given integer',
            (seed) => util.processPositiveInt(seed));
        this.option('-d, --headless', 'run headless ("d" like in "decapitated")');
        this.option('-k, --console-forwarded', 'forward browser console output')
        this.option('-l, --live-log', 'print new log output regularly')
        this.option('-o, --live-output-coverage', 'print new coverage output regularly');
    }

    requireScratchPath() {
        return this.requiredOption(
            '-s, --scratch-path <Path>',
            'path to file (".sb3") or folder with scratch application(s)',
            (scratchPath) => util.processFileOrDirPathExists(scratchPath, '.sb3'),
        );
    }

    optionScratchPath() {
        return this.requiredOption(
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

    requireConfigPath() {
        return this.requiredOption(
            '-c, --config-path <Path>',
            'path to a configuration file (".json")',
            (configPath) => util.processFilePathExists(configPath, '.json'),
            '../config/mio.json',
        );
    }

    optionNumberOfTabs() {
        return this.option(
            '-p, --number-of-tabs <Integer>',
            'number of tabs to execute the tests in',
            (numberTabs) => util.processNumberOfTabs(numberTabs),
            require('os').cpus().length
        );
    }

    /**
     * This method must be invoked for every Whisker subcommand. It makes sure the global "mode" and "opts" variables
     * are set correctly when the respective subcommand is invoked.
     */
    register() {
        this.action((ignored, cmd) => {
            mode = this.name();
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

const subCommands = [
    newSubCommand('run')
        .description('run Whisker tests')
        .requireScratchPath()
        .requireTestPath()
        .optionNumberOfTabs(),

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
            'path to dynamic Whisker tests (".json")',
            (testPath) => util.processFilePathExists(testPath, '.json')),

    newSubCommand('model')
        .description('test with model')
        .requireScratchPath()
        .requiredOption(
            '-m, --model-path <Path>',
            'model to test with',
            (modelPath) => util.processFilePathExists(modelPath))
        .requiredOption(
            '-r, --model-repetition <Integer>',
            'model test repetitions',
            (reps) => util.processPositiveInt(reps),
            1)
        .requiredOption(
            '-t, --model-duration <Integer>',
            'maximal time of one model test run in seconds',
            (duration) => util.processPositiveInt(duration),
            30)
        .option('-c, --model-case-sensitive', 'whether model test should test names case sensitive'),

    newSubCommand('witness')
        .description('generate and replay error witnesses')
        .requireTestPath()
        .optionScratchPath()
        .optionNumberOfTabs()
        .requiredOption(
            '-w, --error-witness-path <Path>',
            'error witness to replay (".json")',
            (witnessPath) => util.processFilePathExists(witnessPath, '.json'))
        .option('-z, --generate-witness-only', 'generate error witness replay without executing it'),

    newSubCommand('mutation')
        .description('run mutation tests')
        .requireScratchPath()
        .requireTestPath()
        .optionNumberOfTabs()
        .requiredOption(
            '-m, --mutators <String...>',
            'the mutation operators to apply',
            (mutators) => util.processMutationOperators(mutators),
            'ALL')
        .option('-e, --mutants-download-path <Path>',
            'where generated mutants should be saved',
            (downloadPath) => util.processDirPathExists(downloadPath)),
];

// Finally, register all subcommands and parse the command line. This sets "mode" and "opts".
subCommands.forEach((cmd) => cmd.register());
whiskerCLI.parse(process.argv);

// The current Whisker mode (i.e., the name of the subcommand) and all given command line options are available in any
// JavaScript module by requiring the "cli.js" module.
module.exports = Object.freeze({
    mode,
    opts,
});
