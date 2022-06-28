const {Command} = require('commander');
const options = require('./options')
// eslint-disable-next-line node/no-unpublished-require
const {version, description} = require('../package.json');

// Global options common to all Whisker subcommands.
// Based on https://github.com/tj/commander.js/blob/master/examples/global-options.js
const whiskerCLI = new class extends Command {
    createCommand(name) {
        return new Command(name)
            .requiredOption(
                '-s, --scratch-path <Path>',
                'path to file ("*.sb3") or folder with scratch application(s)',
                (scratchPath) => options.processFileOrDirPathExists(scratchPath, '.sb3'),
            )
            .requiredOption(
                '-u, --whisker-url <Path>',
                'file URL to Whisker Web (".html")',
                (whiskerWeb) => {
                    const filePath = options.processFilePathExists(whiskerWeb, '.html');
                    return `file://${filePath}`;
                },
                '../whisker-web/dist/index.html',
            )
            .option(
                '-a, --acceleration <Integer>',
                'acceleration factor',
                (factor) => options.processPositiveInt(factor),
                1,
            )
            .option(
                '-v, --csv-file <Path>',
                'create CSV file with results',
                (csvPath) => options.processFilePathNotExists(csvPath),
            )
            .option(
                '-z, --seed <Integer>',
                'seed Scratch-VM with given integer',
                (seed) => options.processPositiveInt(seed),
            )
            .option('-d, --headless', 'run headless ("d" like in "decapitated")')
            .option('-k, --console-forwarded', 'forward browser console output')
            // TODO: These two might not need to be global options -> only required by everything that runs
            //  runTestsOnFile
            .option('-l, --live-log', 'print new log output regularly')
            .option('-o, --live-output-coverage', 'print new coverage output regularly')
    }
}

// Configure the Whisker main command.
whiskerCLI
    .name(process.argv.slice(0, 2).join(' '))
    .version(version)
    .description(description)
    .allowExcessArguments(false);

let mode = null;
let opts = null;

whiskerCLI.command('run')
    .description('Run Whisker tests')
    .requiredOption(
        '-t, --test-path <Path>',
        'path to Whisker tests to run (".js")',
        (testPath) => options.processFilePathExists(testPath, '.js')
    )
    .option(
        '-p, --number-of-tabs <Integer>',
        'number of tabs to execute the tests in',
        (numberTabs) => options.processPositiveInt(numberTabs),
        require('os').cpus().length
    )
    .action((ignored, cmd) => {
        mode = 'run';
        opts = cmd.opts();
    });

whiskerCLI.command('generate')
    .description('Generate Whisker test suites')
    .requiredOption(
        '-t, --test-download-dir <Path>',
        'path to directory for generated tests',
        (testDir) => options.processDirPathExists(testDir),
        __dirname,
    )
    .requiredOption(
        '-c, --config-path <Path>',
        'path to a configuration file (".json")',
        (configPath) => options.processFilePathExists(configPath, '.json'),
        '../config/mio.json',
    )
    .option(
        '-r, --add-random-inputs <Integer>',
        'add random inputs to the test and wait the given number of seconds for its completion',
        (seconds) => options.processPositiveInt(seconds),
        10,
    )
    .action((ignored, cmd) => {
        mode = 'generate';
        opts = cmd.opts();
    });

whiskerCLI.command('dynamic')
    .description('Dynamic test suites using Neuroevolution')
    .requiredOption(
        '-c, --config-path <Path>',
        'path to a configuration file (".json")',
        (configPath) => options.processFilePathExists(configPath, '.json'),
        '../config/mio.json',
    )
    .requiredOption(
        '-t, --test-path <Path>',
        'path to dynamic Whisker tests (".json")',
        (testPath) => options.processFilePathExists(testPath, '.json')
    )
    .action((ignored, cmd) => {
        mode = 'dynamic';
        opts = cmd.opts();
    });

whiskerCLI.command('model')
    .description('Test with model')
    .requiredOption(
        '-m, --model-path <Path>',
        'model to test with',
        (modelPath) => options.processFilePathExists(modelPath)
    )
    .requiredOption(
        '-r, --model-repetition <Integer>',
        'model test repetitions',
        (reps) => options.processPositiveInt(reps),
        1,
    )
    .requiredOption(
        '-t, --model-duration <Integer>',
        'maximal time of one model test run in seconds',
        (duration) => options.processPositiveInt(duration),
        30
    )
    .option('-c, --model-case-sensitive', 'whether model test should test names case sensitive')
    .action((ignored, cmd) => {
        mode = 'model';
        opts = cmd.opts();
    });

// FIXME: complete this command and create witness.js
whiskerCLI.command('witness')
    .description('Generate and replay error witnesses')
    .option(
        '-w, --error-witness-path <Path>',
        'error witness to replay ("*.json")',
        (witnessPath) => options.processFilePathExists(witnessPath, '.json'),
    )
    .option(
        '-z, --generate-witness-only',
        'generate test file with error witness replay without executing it'
    )
    .action((ignored, cmd) => {
        mode = 'witness';
        opts = cmd.opts();
    });

// FIXME: which subcommand shall this belong to? We don't have a separate command just for mutation testing...
//  Maybe it just belongs to test generation because frankly I don't know
whiskerCLI.command('mutation')
    .description('Run mutation tests')
    .option('-mu, --mutators <String>', 'Defines the mutation operators in case mutation testing should be applied', '')
    .option('-md, --mutants-download-path <Path>', 'Defines where and if the generated mutants should be saved', false)


whiskerCLI.parse(process.argv);

module.exports = Object.freeze({
    mode,
    opts,
});
