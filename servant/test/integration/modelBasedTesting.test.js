const runServant = require("../runServantCLI");

describe('Servant: Model-Based Testing', () => {

    const timeout = 20000;

    test('fruitcatcher', async () => {
        let result = await runServant([
            'model',
            '-s whisker-web/test/model/scratch-programs/Fruitcatcher.sb3',
            '-t whisker-web/test/model/user-model-jsons/Fruitcatcher-userModels.json',
            '-p whisker-web/test/model/model-jsons/Fruitcatcher.json',
            '-n 5',
            '-r 1',
            '--seed 123',
            '--acceleration Infinity'
        ]);

        const expectedCoverage =
`Coverage:
 # coverage:
#   combined: 0.94 (51/54)
#   individual:
#     Stage: 1.00 (6/6)
#     Bowl: 0.80 (8/10)
#     Apple: 1.00 (15/15)
#     Bananas: 0.96 (22/23)`

        const expectedModelCoverage =
`Model coverage:
 # modelCoverage:
#   combined: 0.74 (62/84)
#   individual:
#     bowl: 0.67 (4/6)
#     apple: 0.25 (1/4)
#     appleStop: 1.00 (5/5)
#     bananasR: 0.67 (4/6)
#     bananasB: 0.50 (3/6)
#     init: 1.00 (2/2)
#     timer: 0.67 (2/3)
#     timer2: 1.00 (3/3)
#     points: 0.27 (3/11)
#     spawnApple: 1.00 (3/3)
#     spawnBanan: 1.00 (1/1)
#     bananFalling: 1.00 (2/2)
#     threeApples: 1.00 (4/4)
#     threeBananas: 1.00 (4/4)
#     appleState: 1.00 (3/3)
#     bananState: 1.00 (3/3)
#     bananas2: 1.00 (7/7)
#     bananOnRed: 0.71 (5/7)
#     bowlMove: 1.00 (2/2)
#     end: 0.50 (1/2)`;


        expect(result.error).toBeNull();
        expect(result.stdout).toContain(expectedCoverage);
        expect(result.stdout).toContain(expectedModelCoverage);
    }, timeout)

});
