const fs = require('fs');
const {basename} = require('path');
const logger = require('./logger');

const primitivesArrayPrefix = 't.vm.runtime._primitives';
const indentation = ' '.repeat(4);

/**
 * Maps a scratch block name to its Scratch VM internal name
 */
const scratchBlockNames = {
    randomBetween: 'operator_random',
    goToRandomPosition: 'motion_goto',
    glideToRandomPosition: 'motion_glideto'
};

function keyCodeToKeyString(keyCode) {
    switch (keyCode) {
        case 13: return 'Enter';
        case 32: return ' ';
        case 37: return 'ArrowLeft';
        case 38: return 'ArrowUp';
        case 39: return 'ArrowRight';
        case 40: return 'ArrowDown';
        default: throw new Error(`Unknown keycode '${keyCode}'`);
    }
}

function mapScratchBlockNameToInternalName(scratchBlockName) {
    const internalName = scratchBlockNames[scratchBlockName];

    if (internalName) {
        return internalName;
    } else {
        throw new Error(`Unknown Scratch block '${scratchBlockName}'`);
    }
}

function prependLines(string, linePrefix) {
    return string.replace(/(.*)\n/g, `${linePrefix}$1\n`);
}

function codeForAssignmentMockFunction(mockFunction, mockName) {
    return `const ${mockFunction} = target => {\n`
        + `${indentation}const mock = ${mockName}.assignments.find(m => m.actor === target.sprite.name);\n`
        + `${indentation}return mock.assigns[mock.index++];\n};`;
}

function codeForIfElse(condition, ifPart, elsePart) {
    return `if(${condition}) {\n${prependLines(ifPart, indentation)}} else {\n${prependLines(elsePart, indentation)}}\n`;
}

/**
 * Mocks a scratch block under a given condition
 * @param name The internal name of a scratch block
 * @param mockCondition The condition under which the mock is called (can use arguments of the original scratch block function)
 * @param mock The mock function
 * @param functionParameters The parameters of the scratch block function
 * @returns {string} The code for mocking the scratch block
 */
function mockOnCondition(name, mockCondition, mock, functionParameters) {
    const originalFunctionName = `original_${name}`;
    let code = `const ${originalFunctionName} = ${primitivesArrayPrefix}['${name}'];\n`;
    code += `${primitivesArrayPrefix}['${name}'] = ${functionParameters} => {\n`;
    code += prependLines(codeForIfElse(mockCondition, mock, `${originalFunctionName}${functionParameters};\n`), indentation);
    code += `};\n`;

    return code;
}

function mockGoToRandomPosition(mockFunction, mockName) {
    let code = `${codeForAssignmentMockFunction(mockFunction, mockName)}\n`;

    const mockCode = `const {x, y} = ${mockFunction}(util.target);\nutil.target.setXY(x, y);\n`;
    code += mockOnCondition(scratchBlockNames.goToRandomPosition, `args.TO === '_random_'`, mockCode, '(args, util)');

    return code;
}

function mockGlideToRandomPosition(mockFunction, mockName) {
    let code = `${codeForAssignmentMockFunction(mockFunction, mockName)}\n`;

    const originalGlideSecsTo = 'originalGlideSecsTo';
    code += `const ${originalGlideSecsTo} = ${primitivesArrayPrefix}['motion_glidesecstoxy'];\n`
    const mockCodeGlide = `const {x, y} = ${mockFunction}(util.target);\n${originalGlideSecsTo}({SECS: args.SECS, X: x, Y: y}, util);\n`;
    code += mockOnCondition(scratchBlockNames.glideToRandomPosition, `args.TO === '_random_' && !util.stackFrame.timer`, mockCodeGlide, '(args, util)');

    return code;
}

/**
 * Mocks a scratch block
 * @param blockName The name of a scratch block
 * @param mock The mock object: {values: number[], index: 0} which contains the values that the mock should provide during test execution
 * @returns {string} The code for mocking the scratch block
 */
function mockBlock(blockName, mock) {
    const name = mapScratchBlockNameToInternalName(blockName);
    const mockName = 'mock_' + name;
    const mockFunction = `mock_${name}Function`;
    let code = `// Mock for ${blockName}\nconst ${mockName} = ${JSON.stringify(mock)};\n`;

    switch (name) {
        case scratchBlockNames.randomBetween:
            code += `const ${mockFunction} = () => ${mockName}.returns[${mockName}.index++];\n`;
            code += `${primitivesArrayPrefix}['${name}'] = () => ${mockFunction}();\n`
            break;
        case scratchBlockNames.goToRandomPosition:
            code += `${mockGoToRandomPosition(mockFunction, mockName)}`;
            break;
        case scratchBlockNames.glideToRandomPosition:
            code += `${mockGlideToRandomPosition(mockFunction, mockName)}`;
            break;
        default: throw new Error(`Unknown block ${name}`);
    }

    return code;
}

function codeForInitializingMocks(mocks) {
    let code = '';

    if (mocks) {
        code += `// Initializing mocks\n`;
        for (const mock of mocks) {
            const mockName = mock.forFunction;
            code += `${mockBlock(mockName, mock)}\n`;
        }
    }

    return code;
}

function codeForWitnessReplay(errorWitness) {
    let code = `// Error Witness Replay\n`;

    for (const step of errorWitness.steps) {
        const action = step.action;

        switch (action) {
            case 'EPSILON': break;
            case 'WAIT': code += `await t.runForTime(${step.waitMicros / 1000});\n`; break;
            case 'MOUSE_MOVE': code += `t.inputImmediate({device: 'mouse', x: ${step.mousePosition.x}, y: ${step.mousePosition.y}});\n`; break;

            // When inputs are fed to the test driver using t.inputImmediate(..) the Whisker test might not behave as
            // intended. It appears there is some problem when it comes to the order in which inputs, callbacks and
            // step functions are executed within Whisker. The effect is that given answers might get "lost".
            // For now, we use t.addInput(0, ...) instead of t.inputImmediate(...), which seems to resolve this problem.
            // case 'ANSWER': code += `t.inputImmediate({device: 'text', answer: '${step.answer}'});\n`; break;
            case 'ANSWER': code += `t.addInput(0, {device: 'text', answer: '${step.answer}'});\n`; break;

            case 'KEY_DOWN': code += `t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: true});\n`; break;
            case 'KEY_UP': code += `t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: false});\n`; break;
            case 'MOUSE_DOWN': code += `t.inputImmediate({device: 'mouse', isDown: true});\n`; break;
            case 'MOUSE_UP': code += `t.inputImmediate({device: 'mouse', isDown: false});\n`; break;
            default: logger.error(`Unknown error witness step action '${action}' for step ${errorWitness.steps.indexOf(step)}`);
        }
    }

    code += `// Run a few steps more in order to catch the violation\nawait t.runForSteps(10);\n// Error witness replay finished\n`;
    return code;
}

/**
 * Adds instructions to the tests that will replay the error witness.
 * The test has to contain the comment '// REPLAY_ERROR_WITNESS'.
 * The comment will then be replaced with the generated witness steps.
 *
 * @param errorWitnessPath The path to an error witness file.
 * @param constraintsPath The path to the original test.
 * @param tmpDir The path to the tmp directory where the generated test is placed.
 * @returns {string} The path to the generated test.
 */
function attachErrorWitnessReplayToTest(errorWitnessPath, constraintsPath, tmpDir) {
    const errorWitness = JSON.parse(fs.readFileSync(errorWitnessPath, {encoding: 'utf8'}).toString());
    const codeForReplay = `\n${codeForInitializingMocks(errorWitness.mocks)}\n${codeForWitnessReplay(errorWitness)}`;

    return replaceInFile(constraintsPath, "// REPLAY_ERROR_WITNESS", prependLines(codeForReplay, indentation), "_error_witness_replay.js", tmpDir);
}

/**
 * Adds random input generation to a test.
 * The test has to contain the comment '// RANDOM_INPUTS'.
 * The comment will then be replaced with the random input generation.
 *
 * @param constraintsPath The path to the test file.
 * @param tmpDir The path to the tmp directory.
 * @param waitTime How many seconds to wait for the test to complete
 * @returns {string} The path to the generated test.
 */
function attachRandomInputsToTest(constraintsPath, tmpDir, waitTime) {
    const waitTimeMillis = waitTime * 1000; // needs to be converted from seconds into milliseconds
    const randomInputs = `${indentation}t.setRandomInputInterval(150);\n` +
        `${indentation}t.detectRandomInputs({duration: [50, 100]});\n` +
        `${indentation}await t.runForTime(${waitTimeMillis});`;

    return replaceInFile(constraintsPath, "// RANDOM_INPUTS", randomInputs, "_random_inputs.js", tmpDir);
}

function replaceInFile(filePath, searchValue, replacement, outputFileSuffix, tmpDir) {
    const fileWithReplacement = fs.readFileSync(filePath, {encoding: 'utf8'})
        .toString().replace(searchValue, replacement);

    if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir, {recursive: true});
    }
    fs.mkdirSync(tmpDir);

    const path = `${tmpDir}/${basename(filePath)}${outputFileSuffix}`;
    fs.writeFileSync(path, fileWithReplacement, {encoding: 'utf8'});
    return path;
}

module.exports = {attachErrorWitnessReplayToTest, attachRandomInputsToTest}
