const runServant = require("../runServantCLI");

describe('Servant: Block-Based Testing', () => {

    const timeout = 20000;

    test('Two small Block-Based Tests', async () => {
        let result = await runServant([
            'run',
            '-s',
            'servant/test/integration/two-small-bbts.sb3',
            '-t',
            'servant/test/integration/two-small-bbts.sb3'
        ]);

        expect(result.error).toBeNull();
        expect(result.stdout).toContain(
            'Total Tests: 2\n' +
            '├─ Passing Tests: 2\n' +
            '├─ Failing Tests: 0\n' +
            '└─ Timed Out Tests: 0'
        );
    }, timeout);

});
