const {Command, InvalidArgumentError} = require('commander');
const util = require('./util');
const {version, description} = require('./meta');
const {relativeToServantDir} = require("./util");

/**
 * @typedef {Object} Opts
 * @property {number} acceleration Accelerate Scratch VM by the given factor
 * @property {string} [output] Path to CSV file with results
 * @property {string} [seed] Seed for the Scratch VM
 * @property {boolean} headless Run in headless mode
 * @property {boolean} [useSaveStates] Reset project using save states, rather than by reloading it
 * @property {string} [scratchPath] Path to Scratch file or folder with Scratch files
 * @property {string} [testPath] Path to Whisker test suite or BBT project
 * @property {string} [groundTruth] Path to ground truth data for Neatest + Backpropagation
 * @property {string} [configPath] Path to Whisker configuration file
 * @property {number} numberOfJobs Number of parallel test executions
 * @property {string[]} [mutators] Mutation operators to apply for mutation testing
 * @property {string} [downloadMutants] Download the generated mutants
 * @property {number} [mutationBudget] Timeout for mutation analysis
 * @property {number} [maxMutants] Upper bound of analysed mutations during mutation analysis
 * @property {number} [activationTraces] Number of activation traces for surprise adequacy based error detection
 * @property {boolean} [traceAttributes] Activates recording of sprite attributes after every block execution.
 * @property {string} [recordProject] Executes procedure for collecting recording data of single project
 * @property {number} [time] Sets the time for how long gameplay should be recorded in seconds
 * @property {string} whiskerUrl Path to index.html of Whisker Web
 * @property {number} verbose The verbosity level
 */

/**
 * The name of the Whisker subcommand that was invoked.
 *
 * @type {string}
 */
let subcommand = '';

/**
 * The command-line options given to servant.js, parsed as an object of key-value pairs.
 *
 * @type {Opts}
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
        this.description(`Whisker: ${description}`);
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
            (factor) => util.processPositiveInt(factor, true),
            1);
        this.option(
            '-o, --output <Path>',
            'create CSV file with results',
            (csvPath) => util.processFilePathNotExists(csvPath));
        this.option(
            '-z, --seed <String>',
            'custom seed for Scratch-VM');
        this.option(
            '-d, --headless',
            'run headless ("d" like in "decapitated")',
            false); // Has to be false, not undefined, as Puppeteer will not work properly otherwise.
        this.option(
            '--use-save-states',
            'Whether to reset a project by using save states rather than reloading it.'
        );
        this.option(
            '-v, --verbose',
            'Verbose mode. Prints debug messages. Multiple -v increase verbosity. The maximum is 2.',
            (_, v) => v === 2 ? v : v + 1,
            0
        );
        this.option(
            '--keepalive-timeout <Integer>',
            'Timeout in seconds for the keepalive timeout',
            (timeout) => timeout * 1000,
        );
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

    optionWinningStates() {
        return this.option(
            '-w, --winning-states <Path>',
            'path to file (".json") that maps project names to block ids that represent winning states',
            (winningStates) => util.processFilePathExists(winningStates, '.json'),
        );
    }

    requireTestPathForRun() {
        customChecks.push(function checkBBTLimitations() {
            if (!(opts.testPath && opts.testPath.endsWith('.sb3'))) {
                return;
            }

            if (opts.acceleration !== 1) {
                throw new InvalidArgumentError('Test acceleration can only be used with Whisker tests!');
            }

            const validBBTOptions = [
                // always present
                'acceleration',

                // actually valid BBT options
                'headless',
                'scratchPath',
                'testPath',
                'output',
                'seed',
                'verbose',
                'numberOfJobs',
            ];

            for (const key of Object.keys(opts)) {
                if (!validBBTOptions.includes(key)) {
                    throw new InvalidArgumentError(`When using block-based tests, only these options are currently supported: ${validBBTOptions.join(', ')}`);
                }
            }
        });

        return this.requiredOption(
            '-t, --test-path <Path>',
            'path to Whisker tests (".js") or a project containing Block-Based Tests (".sb3") to run',
            (testPath) => util.processFilePathExists(testPath, ['.js', '.sb3'])
        );
    }

    requireTestPath() {
        return this.requiredOption(
            '-t, --test-path <Path>',
            'path to Whisker tests (".js") to run',
            (testPath) => util.processFilePathExists(testPath, '.js')
        );
    }

    optionTestPath() {
        return this.option(
            '-t, --test-path <Path>',
            'path to Whisker tests to run (".js") or dynamic test suites',
            (testPath) => util.processFilePathExists(testPath, ['.js', '.json']),
        );
    }

    optionGroundTruthPath() {
        return this.option(
            '-g, --ground-truth <Path>',
            'path to GroundTruth data for Neatest + Backpropagation',
            (groundTruth) => util.processFilePathExists(groundTruth, '.json'),
        );
    }

    optionConfigPath() {
        return this.option(
            '-c, --config-path <Path>',
            'path to a configuration file (".json")',
            (configPath) => util.processFilePathExists(configPath, '.json'),
            relativeToServantDir('../config/mio.json')
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

    optionNumberOfJobs() {
        return this.option(
            '-j, --number-of-jobs <Integer>',
            'number of jobs (Chromium tabs) for test execution',
            (jobs) => util.processNumberOfJobs(jobs),
            1
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
            if ('downloadMutants' in opts && !('mutators' in opts)) {
                throw new InvalidArgumentError('You gave a download path for mutants but did not enable mutators.');
            }
        });

        return this.option(
            '-dm, --download-mutants',
            'downloads the generated mutants',
        );
    }

    optionMutationBudget() {
        customChecks.push(function mutationBudgetImpliesMutators() {
            if ('mutationBudget' in opts && !('mutators' in opts)) {
                throw new InvalidArgumentError('You gave a budget for mutation but did not enable mutators.');
            }
        });

        return this.option(
            '-bt, --mutation-budget <Integer>',
            'timeout for the mutation analysis',
            (budget) => util.processPositiveInt(budget));
    }

    optionMaxMutants() {
        customChecks.push(function maxMutantsImpliesMutators() {
            if ('maxMutants' in opts && !('mutators' in opts)) {
                throw new InvalidArgumentError('You gave a maximum number for mutants but did not enable mutators.');
            }
        });

        return this.option(
            '-bm, --max-mutants <Integer>',
            'upper bound of analysed mutants during mutation analysis',
            (maxMutants) => util.processPositiveInt(maxMutants));
    }

    optionActivationTraceRepetitions() {
        return this.option(
            '-at, --activation-traces <Integer>',
            'number of activation traces for surprise adequacy based error detection',
            (activationTraces) => util.processPositiveInt(activationTraces));
    }

    optionTraceAttributes() {
        return this.option(
            '-ta, --trace-attributes',
            'activates recording of sprite attributes after every executed block',
        );
    }

    optionRecordProject() {
        return this.option(
            '-rp, --record-project <Path>',
            'Executes procedure for collecting recording data of single project.',
            projectPath => util.processFileOrDirPathExists(projectPath, '.sb3'));
    }

    optionRecordingTime() {
        return this.option(
            '-rt, --recording-time <Integer>',
            'Limits the time for how long gameplay should be recorded in seconds (default: Infinity).',
            seconds => util.processPositiveInt(seconds),
            Infinity);
    }

    optionProgramModel(required = false) {
        return (required ? this.requiredOption : this.option).call(
            this,
            '-p, --model-path <Path>',
            'model to test with',
            (modelPath) => util.processFilePathExists(modelPath)
        );
    }

    optionSpritesTraces() {
        return this.option(
            '--trace <Path>',
            'create JSON file with results',
            (tracePath) => util.processFilePathNotExists(tracePath)
        )
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

/**
 * Creates a new Whisker subcommand of the given name.
 *
 * @param name {string} The name of the subcommand
 * @return {WhiskerSubCommand}
 */
function newSubCommand(name) {
    // noinspection JSValidateTypes
    return whiskerCLI.command(name);
}

// noinspection JSUnresolvedFunction
const subCommands = [
    newSubCommand('open')
        .description('Open the Whisker web page with the specified parameters')
        .optionScratchPath()
        .optionConfigPath()
        .optionRecordProject()
        .optionRecordingTime(),

    newSubCommand('run')
        .description('run Whisker tests or block-based tests')
        .requireScratchPath()
        .requireTestPathForRun()
        .optionNumberOfJobs()
        .optionMutators()
        .optionMutantsDownloadPath()
        .optionMutationBudget()
        .optionMaxMutants()
        .optionProgramModel()
        .optionTraceAttributes(),

    newSubCommand('generate')
        .description('generate Whisker test suites')
        .requireScratchPath()
        .requireConfigPath()
        .requiredOption(
            '-t, --test-download-dir <Path>',
            'path to directory for generated tests',
            (testDir) => util.processDirPathExists(testDir),
            __dirname)
        .optionGroundTruthPath()
        .optionWinningStates(),

    newSubCommand('dynamic')
        .description('dynamic test suites using Neuroevolution')
        .requireScratchPath()
        .requireConfigPath()
        .requiredOption(
            '-t, --test-path <Path>',
            'path to dynamic test suite',
            (testPath) => util.processFilePathExists(testPath, ['json', 'zip']))
        .optionActivationTraceRepetitions()
        .optionMutators()
        .optionMutantsDownloadPath()
        .optionMutationBudget()
        .optionMaxMutants()
        .optionProgramModel()
        .optionWinningStates()
        .optionSpritesTraces(),

    newSubCommand('model')
        .description('test with model')
        .requireScratchPath()
        .optionProgramModel(true)
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
        .optionNumberOfJobs()
        .optionMutators()
        .optionMutantsDownloadPath()
        .optionMutationBudget()
        .optionMaxMutants()
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
    whiskerUrl: `file://${relativeToServantDir('../whisker-web/dist/index.html')}`,
    numberOfJobs: 1,
    ...opts,
};

// The current Whisker mode (i.e., the name of the subcommand) and all given command line options are available in any
// JavaScript module by requiring the "cli.js" module.
module.exports = Object.freeze({
    subcommand,
    opts,
});
