const runServant = require("../runServantCLI");

describe('Servant: Model-Based Testing', () => {

    const timeout = 20000;

    test('fruitcatcher', async () => {
        let result = await runServant([
            'model',
            '-s whisker-web/test/model/scratch-programs/fruitcatcher.sb3',
            '-p whisker-web/test/model/model-jsons/fruitcatcher-random-fruit.json',
            '-n 3',
            '-r 1',
            '--seed 123',
            '--acceleration Infinity'
        ]);

        const expectedCoverage =
            "Coverage:\n" +
            " # coverage:\n" +
            "#   combined: 0.80 (43/54)\n" +
            "#   individual:\n" +
            "#     Stage: 1.00 (6/6)\n" +
            "#     Bowl: 0.80 (8/10)\n" +
            "#     Apple: 0.87 (13/15)\n" +
            "#     Bananas: 0.70 (16/23)";

        const expectedModelCoverage =
            "Model coverage:\n" +
            " # modelCoverage:\n" +
            "#   combined: 0.71 (58/82)\n" +
            "#   individual:\n" +
            "#     bowl: 0.67 (4/6)\n" +
            "#     apple: 0.75 (3/4)\n" +
            "#     appleStop: 0.60 (3/5)\n" +
            "#     bananasR: 0.50 (3/6)\n" +
            "#     bananasB: 0.67 (4/6)\n" +
            "#     init: 1.00 (2/2)\n" +
            "#     timer: 0.50 (1/2)\n" +
            "#     timer2: 1.00 (3/3)\n" +
            "#     points: 0.82 (9/11)\n" +
            "#     spawnApple: 1.00 (3/3)\n" +
            "#     spawnBanan: 1.00 (1/1)\n" +
            "#     bananFalling: 1.00 (2/2)\n" +
            "#     threeApples: 0.75 (3/4)\n" +
            "#     threeBananas: 0.75 (3/4)\n" +
            "#     appleState: 1.00 (2/2)\n" +
            "#     bananState: 1.00 (3/3)\n" +
            "#     bananas2: 0.57 (4/7)\n" +
            "#     bananOnRed: 0.43 (3/7)\n" +
            "#     bowlMove: 1.00 (2/2)\n" +
            "#     end: 0.00 (0/2)";


        expect(result.error).toBeNull();
        expect(result.stdout).toContain(expectedCoverage);
        expect(result.stdout).toContain(expectedModelCoverage);
    }, timeout)

});
