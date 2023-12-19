const goboInitialization = async function (t) {
    await t.wait(2);
    let gobo = t.getSprite('Gobo');
    t.assert.ok(!gobo.visible, 'gobo must be not visible');
    t.end();
};

const creatureInitialization = async function (t) {
    await t.wait(2);
    let creature = t.getSprite('Kreatur');
    t.assert.ok(!creature.visible, 'creature must be not visible');
    t.end();
};

const pointsInitialization = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    let score = stage.getVariable('Punkte');
    t.assert.ok(parseInt(score.value, 10) === 0, 'score must be reset');
    t.end();
};

const goboAppears = async function (t) {
    await t.wait(2);
    let gobo = t.getSprite('Gobo');
    t.assert.ok(!gobo.visible, 'gobo must be not visible');
    let creature = t.getSprite('Kreatur');
    let stage = t.getStage();
    let score = stage.getVariable('Punkte');
    t.addCallback(() => {
        for (const clone of creature.getClones()) {
            t.clickClone(clone);
        }
    });
    await t.runUntil(() => parseInt(score.value, 10) >= 3, 10000);
    await t.wait(5);
    t.assert.ok(parseInt(score.value, 10) >= 3, 'score not 3');
    t.assert.ok(gobo.visible, 'gobo must be  visible');
    t.end();
};

module.exports = [
    {
        test: goboInitialization,
        name: 'initialize gobo',
        description: '',
        categories: []
    },
    {
        test: creatureInitialization,
        name: 'initialize creature',
        description: '',
        categories: []
    },
    {
        test: pointsInitialization,
        name: 'initialize points',
        description: '',
        categories: []
    },
    {
        test: goboAppears,
        name: 'gobo appears',
        description: '',
        categories: []
    }
];
