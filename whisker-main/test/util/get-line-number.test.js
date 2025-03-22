import {expect} from "@jest/globals";
import {getLineNumber} from "../../src/util/get-line-number";

test.each([
    [["AssertionError [ERR_ASSERTION]: 'abc' == 'def'",
        "    at new AssertionError (whisker-gui.js:8382:13)",
        "    at assert.equal (whisker-gui.js:215762:15)",

        // This is the line we are interested in:
        "    at Test.test (eval at loadTestsFromString (whisker-gui.js:12715:13), <anonymous>:13:14)",

        "    at TestRunner._executeTest (whisker-gui.js:217298:32)",
        "    at TestRunner.runTestsForRepair (whisker-gui.js:217072:48)",
        "    at async window.Whisker.runTestsForRepair (whisker-gui.js:12956:10)",
        "    at async <anonymous>:1:1",
    ], 13],
    [[
        "Error",
        "    at EventEmitter.equal (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:215782:44)",

        // This is the line we are interested in:
        "    at Test.test231 [as test] (eval at loadTestsFromString (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:12715:13), <anonymous>:33:12)",

        "    at async TestRunner._executeTest (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:217373:21)",
        "    at async TestRunner.runTestsForRepair (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:217143:17)",
        "    at async window.Whisker.runTestsForRepair (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:12956:10)",
        "    at async pptr://__puppeteer_evaluation_script__:2:17",
    ], 33],
    [[
        "AssertionError [ERR_ASSERTION]: Banana must not be visible for a second in the beginning.",
        "    at new AssertionError (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:8382:13)",
        "    at EventEmitter.ok (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:215681:19)",

        // This is the line we are interested in:
        "    at Constraint.eval [as _callback] (eval at loadTestsFromString (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:12729:13), <anonymous>:612:22)",

        "    at Constraint._check (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:218080:18)",
        "    at Constraints.checkConstraints (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:218145:52)",
        "    at VMWrapper.step (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:220806:46)",
        "    at async VMWrapper.run (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:220839:35)",
        "    at async VMWrapper.runForTime (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:220875:16)",
        "    at async Test.testBananaFallDelay [as test] (eval at loadTestsFromString (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:12729:13), <anonymous>:615:5)",
        "    at async TestRunner._executeTest (file:///home/user/whisker-main/whisker-web/dist/whisker-gui.js:217379:21)",
        "    at getLineNumber (/home/user/whisker-main/whisker-main/dist/node/whisker.js:91363:11)",
        "    at /home/user/whisker-main/whisker-main/dist/node/whisker.js:90740:63",
        "    at Array.map (<anonymous>)",
        "    at CountPassedAssertionsOnce.<anonymous> (/home/user/whisker-main/whisker-main/dist/node/whisker.js:90733:18)",
        "    at Generator.next (<anonymous>)",
        "    at /home/user/whisker-main/whisker-main/dist/node/whisker.js:90697:71",
        "    at new Promise (<anonymous>)",
        "    at __webpack_modules__../src/repair/fitness-functions/CountPassedAssertionsOnce.ts.__awaiter (/home/user/whisker-main/whisker-main/dist/node/whisker.js:90693:12)",
        "    at CountPassedAssertionsOnce._getFitness (/home/user/whisker-main/whisker-main/dist/node/whisker.js:90727:16)",
        "    at CountPassedAssertionsOnce.<anonymous> (/home/user/whisker-main/whisker-main/dist/node/whisker.js:90999:25)",
    ], 612],
    [[
        "Error",
        "   at EventEmitter.ok (file:///whisker/whisker-web/dist/whisker-gui.js:216214:43)",

        // This is the line we are interested in:
        "   at Sprites.eval [as _onSpriteMoved] (eval at loadTestsFromString (file:///whisker/whisker-web/dist/whisker-gui.js:12765:13), <anonymous>:1553:22)",

        "   at Sprites.doOnSpriteMoved (file:///whisker/whisker-web/dist/whisker-gui.js:220266:18)",
        "   at RenderedTarget.emit (file:///whisker/whisker-web/dist/whisker-gui.js:34934:7)",
        "   at RenderedTarget.setXY (file:///whisker/whisker-web/dist/whisker-gui.js:165793:14)",
        "   at Scratch3MotionBlocks.goToXY (file:///whisker/whisker-web/dist/whisker-gui.js:133060:21)",
        "   at execute (file:///whisker/whisker-web/dist/whisker-gui.js:137340:40)",
        "   at Sequencer.stepThread (file:///whisker/whisker-web/dist/whisker-gui.js:141964:17)",
        "   at Sequencer.stepThreads (file:///whisker/whisker-web/dist/whisker-gui.js:141855:26)",
        "   at Runtime._executeStep (file:///whisker/whisker-web/dist/whisker-gui.js:140834:44)",
        "   at getLineNumber (/whisker/whisker-main/dist/node/whisker.js:91839:11)",
        "   at /whisker/whisker-main/dist/node/whisker.js:91243:96",
        "   at Array.map (<anonymous>)",
        "   at DefaultRepairFitnessFunction._getFitnessForTrace (/whisker/whisker-main/dist/node/whisker.js:91243:54)",
        "   at /whisker/whisker-main/dist/node/whisker.js:91262:38",
        "   at Array.map (<anonymous>)",
        "   at DefaultRepairFitnessFunction.<anonymous> (/whisker/whisker-main/dist/node/whisker.js:91262:18)",
        "   at Generator.next (<anonymous>)",
        "   at /whisker/whisker-main/dist/node/whisker.js:91210:71",
        "   at new Promise (<anonymous>)",
    ], 1553]
])('getLineNumber test #%#', (trace, lineNumber) => {
    expect(getLineNumber(trace.join('\n'))).toStrictEqual(lineNumber);
    expect(getLineNumber(trace.join('\r\n'))).toStrictEqual(lineNumber);
});
