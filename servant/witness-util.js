const fs = require('fs');
const {basename} = require('path');
const {logger} = require('./util');

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
    let code = `${indentation}const ${originalFunctionName} = ${primitivesArrayPrefix}['${name}'];\n`;
    code += `${indentation}${primitivesArrayPrefix}['${name}'] = ${functionParameters} => ${mockCondition} ? ${mock} : ${originalFunctionName}${functionParameters};\n`;

    return code;
}

/**
 * Mocks a scratch block
 * @param name The internal name of a scratch block
 * @param mock The mock object: {values: number[], index: 0} which contains the values that the mock should provide during test execution
 * @returns {string} The code for mocking the scratch block
 */
function mockBlock(name, mock) {
    const mockName = 'mock_' + name;
    const mockFunction = `mock_${name}Function`;
    let code = `${indentation}const ${mockName} = ${JSON.stringify(mock)};\n`;
    code += `${indentation}const ${mockFunction} = () => ${mockName}.values[${mockName}.index++];\n`;

    switch (name) {
        case scratchBlockNames.randomBetween:
            code += `${indentation}${primitivesArrayPrefix}['${name}'] = () => ${mockFunction}();\n`
            break;
        case scratchBlockNames.goToRandomPosition:
            code += mockOnCondition(name, `args.TO === '_random_'`, `util.target.setXY(${mockFunction}(),${mockFunction}())`, '(args, util)');
            break;
        case scratchBlockNames.glideToRandomPosition:
            const originalGlideSecsTo = 'originalGlideSecsTo';
            code += `${indentation}const ${originalGlideSecsTo} = ${primitivesArrayPrefix}['motion_glidesecstoxy'];\n`
            code += mockOnCondition(name, `args.TO === '_random_' && !util.stackFrame.timer`, `${originalGlideSecsTo}({SECS: args.SECS, X: ${mockFunction}(), Y: ${mockFunction}()}, util)`, '(args, util)')
            break;
        default: throw new Error(`Unknown block ${name}`);
    }
    code += '\n';
    return code;
}

function codeForInitializingMocks(mocks) {
    let code = '';

    if (mocks) {
        code += `{\n${indentation}// Initializing mocks\n`;
        for (const mockName of Object.keys(mocks)) {
            const internalName = mapScratchBlockNameToInternalName(mockName);
            code += mockBlock(internalName, mocks[mockName]);
        }
        code += "}\n";
    }

    return code;
}

function codeForWitnessReplay(errorWitness) {
    let code = `${indentation}// Error Witness Replay`;

    for (const step of errorWitness.steps) {
        const action = step.action;

        switch (action) {
            case 'EPSILON': break;
            case 'WAIT': code += `${indentation}await t.runForTime(${step.waitMicros / 1000});\n`; break;
            case 'MOUSE_MOVE': code += `${indentation}t.inputImmediate({device: 'mouse', x: ${step.mousePosition.x}, y: ${step.mousePosition.y}});\n`; break;
            case 'ANSWER': code += `${indentation}t.inputImmediate({device: 'text', answer: '${step.answer}'});\n`; break;
            case 'KEY_DOWN': code += `${indentation}t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: true});\n`; break;
            case 'KEY_UP': code += `${indentation}t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: false});\n`; break;
            case 'MOUSE_DOWN': code += `${indentation}t.inputImmediate({device: 'mouse', isDown: true});\n`; break;
            case 'MOUSE_UP': code += `${indentation}t.inputImmediate({device: 'mouse', isDown: false});\n`; break;
            default: logger.error(`Unknown error witness step action '${action}' for step ${errorWitness.steps.indexOf(step)}`);
        }
    }

    code += `${indentation}// Run a few steps more in order to catch the violation\n${indentation}await t.runForSteps(10);\n${indentation}// Error witness replay finished\n`;
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

    return replaceInFile(constraintsPath, "// REPLAY_ERROR_WITNESS", codeForReplay, "_error_witness_replay.js", tmpDir);
}

/**
 * Adds random input generation to a test.
 * The test has to contain the comment '// RANDOM_INPUTS'.
 * The comment will then be replaced with the random input generation.
 *
 * @param constraintsPath The path to the test file.
 * @param tmpDir The path to the tmp directory.
 * @returns {string} The path to the generated test.
 */
function attachRandomInputsToTest(constraintsPath, tmpDir) {
    const randomInputs = `${indentation}.setRandomInputInterval(150);\n` +
        `${indentation}t.detectRandomInputs({duration: [50, 100]});\n` +
        `${indentation}await t.runForTime(300000);`;

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
