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
`Coverage:
 # coverage:
#   combined: 0.65 (35/54)
#   individual:
#     Stage: 1.00 (6/6)
#     Bowl: 0.70 (7/10)
#     Apple: 0.60 (9/15)
#     Bananas: 0.57 (13/23)`

        const expectedModelCoverage =
`Model coverage:
 # modelCoverage:
#   combined: 0.48 (39/82)
#   individual:
#     bowl: 0.50 (3/6)
#     apple: 0.25 (1/4)
#     appleStop: 0.40 (2/5)
#     bananasR: 0.50 (3/6)
#     bananasB: 0.33 (2/6)
#     init: 1.00 (2/2)
#     timer: 0.50 (1/2)
#     timer2: 1.00 (3/3)
#     points: 0.27 (3/11)
#     spawnApple: 0.67 (2/3)
#     spawnBanan: 1.00 (1/1)
#     bananFalling: 1.00 (2/2)
#     threeApples: 0.25 (1/4)
#     threeBananas: 0.25 (1/4)
#     appleState: 1.00 (2/2)
#     bananState: 1.00 (3/3)
#     bananas2: 0.43 (3/7)
#     bananOnRed: 0.29 (2/7)
#     bowlMove: 1.00 (2/2)
#     end: 0.00 (0/2)`;


        expect(result.error).toBeNull();
        expect(result.stdout).toContain(expectedCoverage);
        expect(result.stdout).toContain(expectedModelCoverage);
    }, timeout)

});
