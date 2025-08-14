const runServant = require("../runServantCLI");

describe('Servant: Model-Based Testing', () => {

    const timeout = 20000;

    test('fruitcatcher', async () => {
        let result = await runServant([
            'model',
            '-s whisker-web/test/model/scratch-programs/fruitcatcher.sb3',
            '-t whisker-web/test/model/user-model-jsons/fruitcatcher-userModel.json',
            '-p whisker-web/test/model/model-jsons/fruitcatcher.json',
            '-n 3',
            '-r 1',
            '--seed 123',
            '--acceleration Infinity'
        ]);

        const expectedCoverage =
`Coverage:
 # coverage:
#   combined: 0.85 (46/54)
#   individual:
#     Stage: 1.00 (6/6)
#     Bowl: 0.80 (8/10)
#     Apple: 0.93 (14/15)
#     Bananas: 0.78 (18/23)`

        const expectedModelCoverage =
`Model coverage:
 # modelCoverage:
#   combined: 0.81 (67/83)
#   individual:
#     bowl: 0.67 (4/6)
#     apple: 1.00 (4/4)
#     appleStop: 0.80 (4/5)
#     bananasR: 0.83 (5/6)
#     bananasB: 0.83 (5/6)
#     init: 1.00 (2/2)
#     timer: 0.67 (2/3)
#     timer2: 1.00 (3/3)
#     points: 0.91 (10/11)
#     spawnApple: 1.00 (3/3)
#     spawnBanan: 1.00 (1/1)
#     bananFalling: 1.00 (2/2)
#     threeApples: 0.75 (3/4)
#     threeBananas: 0.75 (3/4)
#     appleState: 1.00 (2/2)
#     bananState: 1.00 (3/3)
#     bananas2: 0.71 (5/7)
#     bananOnRed: 0.57 (4/7)
#     bowlMove: 1.00 (2/2)
#     end: 0.00 (0/2)`;


        expect(result.error).toBeNull();
        expect(result.stdout).toContain(expectedCoverage);
        expect(result.stdout).toContain(expectedModelCoverage);
    }, timeout)

});
