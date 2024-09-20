const runServant = require("../runServantCLI");

describe('Servant: Whisker Tests', () => {

    const timeout = 20000;

    test('Snake', async () => {
        let result = await runServant([
            'run',
            '-s whisker-web/src/examples/Snake.sb3',
            '-t whisker-web/src/examples/SnakeTest.js',
            '-a Infinity'
        ]);

        const expectedSummary =
            "Summary:\n" +
            " # summary:\n" +
            "#   Snake.sb3:\n" +
            "#     passed Tests (3):\n" +
            "#       - initialize head\n" +
            "#       - initialize body\n" +
            "#       - clones must be deleted\n" +
            "#     failed Tests (0): None\n" +
            "#     error Tests (0): None\n" +
            "#     skipped Tests (0): None";

        const expectedCoverage =
            "Coverage:\n" +
            " # coverage:\n" +
            "#   combined: 0.54 (32/59)\n" +
            "#   individual:\n" +
            "#     Stage: NaN (0/0)\n" +
            "#     Kopf: 0.52 (15/29)\n" +
            "#     Körper: 1.00 (7/7)\n" +
            "#     Punkt: 0.57 (4/7)\n" +
            "#     Goodie: 0.38 (6/16)";

        expect(result.error).toBeNull();
        expect(result.stdout).toContain(expectedSummary);
        expect(result.stdout).toContain(expectedCoverage);
    }, timeout)

});
