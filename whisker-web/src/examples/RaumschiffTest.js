const rocketInitialization = async function (t) {
    await t.wait(2);
    let rocket = t.getSprite('Raumschiff');
    t.assert.ok(rocket.visible, 'rocket must be visible');
    t.end();
};

const blackHoleInitialization = async function (t) {
    await t.wait(2);
    let hole = t.getSprite('Schwarzes Loch');
    t.assert.ok(hole.visible, 'black hole must be visible');
    t.end();
};

const starInitialization = async function (t) {
    await t.wait(2);
    let star = t.getSprite('Stern');
    t.assert.ok(!star.visible, 'star must not be visible');
    t.end();
};

const moonInitialization = async function (t) {
    await t.wait(2);
    let moon = t.getSprite('Mond');
    t.assert.ok(moon.visible, 'moon must not be visible');
    t.end();
};

const rocketMoving = async function (t) {
    await t.wait(2);
    let rocket = t.getSprite('Raumschiff');
    let rocketY = rocket.y;
    await t.wait(20);
    t.assert.ok(rocketY < rocket.y, "rocket must move");
    let rocketDir = rocket.direction;
    t.keyPress('right arrow', 10);
    await t.wait(10);
    t.assert.ok(rocketDir < rocket.direction, "rocket must turn right");
    rocketDir = rocket.direction;
    await t.wait(20);
    t.assert.ok(rocketDir === rocket.direction, "rocket must not turn right");
    t.end();
};

module.exports = [
    {
        test: rocketInitialization,
        name: 'initialize rocket',
        description: '',
        categories: []
    },
    {
        test: blackHoleInitialization,
        name: 'initialize black hole',
        description: '',
        categories: []
    },
    {
        test: starInitialization,
        name: 'initialize star',
        description: '',
        categories: []
    },
    {
        test: moonInitialization,
        name: 'initialize moon',
        description: '',
        categories: []
    },
    {
        test: rocketMoving,
        name: 'rocket moving',
        description: '',
        categories: []
    }
];
