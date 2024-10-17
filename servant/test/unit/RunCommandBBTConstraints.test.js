const runServant = require("../runServantCLI");

describe('Servant: Unit tests for the "run" command using a Scratch project as test file (Block-Based Testing)', () => {

    const timeout = 5000;

    test('Test Acceleration prohibited', async () => {
        let result = await runServant([
            'run',
            '-s whisker-web/test/integration/blockBasedTesting/batchEval/',
            '-t whisker-web/test/integration/blockBasedTesting/batchEval/bbt-batcheval-solution.sb3',
            '--acceleration Infinity'
        ]);

        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.message).toContain("InvalidArgumentError: Test acceleration can only be used with Whisker tests!");

    }, timeout);
});
