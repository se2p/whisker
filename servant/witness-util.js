const fs = require('fs');
const {basename} = require('path');
const {logger} = require('./util');

const primitivesArrayPrefix = 't.vm.runtime._primitives';
const indentation = ' '.repeat(4);

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

function mockOnCondition(name, mockCondition, mock, functionParameters) {
    const originalFunctionName = `original_${name}`;
    let code = `${indentation}const ${originalFunctionName} = ${primitivesArrayPrefix}['${name}'];\n`;
    code += `${indentation}${primitivesArrayPrefix}['${name}'] = ${functionParameters} => ${mockCondition} ? ${mock} : ${originalFunctionName}${functionParameters};\n`;

    return code;
}

function mockBlock(name, mock) {
    const mockName = 'mock_' + name;
    const mockFunction = `mock_${name}Function`;
    let code = `${indentation}const ${mockName} = ${JSON.stringify(mock)};\n`;
    code += `${indentation}const ${mockFunction} = () => ${mockName}.values[${mockName}.index++];\n`;

    switch (name) {
        case 'operator_random':
            code += `${indentation}${primitivesArrayPrefix}['${name}'] = () => ${mockFunction}();\n`
            break;
        case 'motion_goto':
            code += mockOnCondition(name, `args.TO === '_random_'`, `util.target.setXY(${mockFunction}(),${mockFunction}())`, '(args, util)');
            break;
        case 'motion_glideto':
            const originalGlideSecsTo = 'originalGlideSecsTo';
            code += `${indentation}const ${originalGlideSecsTo} = ${primitivesArrayPrefix}['motion_glidesecstoxy'];\n`
            code += mockOnCondition(name, `args.TO === '_random_' && !util.stackFrame.timer`, `${originalGlideSecsTo}({SECS: args.SECS, X: ${mockFunction}(), Y: ${mockFunction}()}, util)`, '(args, util)')
            break;
        default: throw new Error(`Unknown block ${name}`);
    }
    code += '\n';
    return code;
}

function attachErrorWitnessReplayToTest(errorWitnessPath, constraintsPath, tmpDir) {
    const errorWitness = JSON.parse(fs.readFileSync(errorWitnessPath, {encoding: 'utf8'}).toString());
    let errorReplay = "\n"

    const mocks = errorWitness.mocks;
    if (mocks) {
        errorReplay += `{\n${indentation}// Initializing mocks\n`;
        for (const mockName of Object.keys(mocks)) {
            errorReplay += mockBlock(mockName, mocks[mockName]);
        }
        errorReplay += "}\n";
    }

    errorReplay += `${indentation}// Error witness replay\n`;

    for (const step of errorWitness.steps) {
        const action = step.action;

        switch (action) {
            case 'EPSILON': break;
            case 'WAIT': errorReplay += `${indentation}await t.runForTime(${step.waitMicros / 1000});\n`; break;
            case 'MOUSE_MOVE': errorReplay += `${indentation}t.inputImmediate({device: 'mouse', x: ${step.mousePosition.x}, y: ${step.mousePosition.y}});\n`; break;
            case 'ANSWER': errorReplay += `${indentation}t.inputImmediate({device: 'text', answer: '${step.answer}'});\n`; break;
            case 'KEY_DOWN': errorReplay += `${indentation}t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: true});\n`; break;
            case 'KEY_UP': errorReplay += `${indentation}t.inputImmediate({device: 'keyboard', key: '${keyCodeToKeyString(step.keyPressed)}', isDown: false});\n`; break;
            case 'MOUSE_DOWN': errorReplay += `${indentation}t.inputImmediate({device: 'mouse', isDown: true});\n`; break;
            case 'MOUSE_UP': errorReplay += `${indentation}t.inputImmediate({device: 'mouse', isDown: false});\n`; break;
            default: logger.error(`Unknown error witness step action '${action}' for step ${errorWitness.steps.indexOf(step)}`);
        }
    }

    errorReplay += `${indentation}// Run a few steps more in order to catch the violation\n${indentation}await t.runForSteps(10);\n${indentation}// Error witness replay finished\n`;

    return replaceInFile(constraintsPath, "// REPLAY_ERROR_WITNESS", errorReplay, "_error_witness_replay.js", tmpDir);
}

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
