const pirateInitialization = async function (t) {
    await t.wait(2);
    let pirate = t.getSprite('Pirat');
    t.assert.ok(pirate.visible, 'Pirat must be visible');
    t.end();
};

const girlInitialization = async function (t) {
    await t.wait(2);
    let girl = t.getSprite('Mädchen');
    t.assert.ok(!girl.visible, 'girl must not be visible');
    t.end();
};

const treasureInitialization = async function (t) {
    await t.wait(2);
    let treasure = t.getSprite('Schatztruhe');
    t.assert.ok(!treasure.visible, 'treasure must not be visible');
    t.end();
};

const isleInitialization = async function (t) {
    await t.wait(2);
    let isle = t.getSprite('Vulkaninsel');
    t.assert.ok(!isle.visible, 'isle must not be visible');
    t.end();
};

const cardInitialization = async function (t) {
    await t.wait(2);
    let card = t.getSprite('Schatzkarte');
    t.assert.ok(card.visible, 'card must be visible');
    t.end();
};

const girlShowShort = async function (t) {
    t.seedScratch('!#$%"§seed');
    await t.wait(2);
    let pirate = t.getSprite('Pirat');
    let girl = t.getSprite('Mädchen');
    let treasure = t.getSprite('Schatztruhe');
    let minSizeReached = false;
    let failed = false;
    t.addCallback(() => {
        if (!minSizeReached && treasure.visible) {
            minSizeReached = true;
        }
        if (girl.visible) {
            failed = true;
        }
    });
    await t.runUntil(() => minSizeReached, 20000);

    t.assert.ok(!failed, "girl became visible before reaching treasure");
    t.assert.ok(treasure.visible, "treasure not visible");
    let sizeBoy = pirate.size;
    let sizeGirl = girl.size;
    let spokeText = false;
    t.addCallback(() => {
        if (pirate.sayText.includes('Happy')) {
            spokeText = true;
        }
    });
    await t.runUntil(() => spokeText, 10000);
    t.assert.ok(spokeText, "pirate must have said his monologue");
    let finished = false;
    t.addCallback(() => {
        if (pirate.sayText === "") {
            finished = true;
        }
    });
    await t.runUntil(() => finished, 2500);
    t.wait(5);
    t.assert.ok(girl.visible, "girl must be visible");
    t.assert.ok(girl.size > sizeGirl, "girl must increase in size");
    t.assert.ok(pirate.size > sizeBoy, "pirate must increase in size");
    t.end();
};

const girlShowLong = async function (t) {
    t.seedScratch('#seed')
    await t.wait(2);
    let pirate = t.getSprite('Pirat');
    let girl = t.getSprite('Mädchen');
    let treasure = t.getSprite('Schatztruhe');
    let minSizeReached = false;
    let failed = false;
    t.addCallback(() => {
        if (!minSizeReached && treasure.visible) {
            minSizeReached = true;
        }
        if (girl.visible) {
            failed = true;
        }
    });
    await t.runUntil(() => minSizeReached, 20000);

    t.assert.ok(!failed, "girl became visible before reaching treasure");
    t.assert.ok(treasure.visible, "treasure not visible");
    let sizeBoy = pirate.size;
    let sizeGirl = girl.size;
    let spokeText = false;
    t.addCallback(() => {
        if (pirate.sayText.includes('Happy')) {
            spokeText = true;
        }
    });
    await t.runUntil(() => spokeText, 10000);
    t.assert.ok(spokeText, "pirate must have said his monologue");
    let finished = false;
    t.addCallback(() => {
        if (pirate.sayText === "") {
            finished = true;
        }
    });
    await t.runUntil(() => finished, 2500);
    t.wait(5);
    t.assert.ok(girl.visible, "girl must be visible");
    t.assert.ok(girl.size > sizeGirl, "girl must increase in size");
    t.assert.ok(pirate.size > sizeBoy, "pirate must increase in size");
    t.end();
};

module.exports = [
    {
        test: pirateInitialization,
        name: 'initialize pirate',
        description: '',
        categories: []
    },
    {
        test: isleInitialization,
        name: 'initialize isle',
        description: '',
        categories: []
    },
    {
        test: cardInitialization,
        name: 'initialize card',
        description: '',
        categories: []
    },
    {
        test: girlInitialization,
        name: 'initialize girl',
        description: '',
        categories: []
    },
    {
        test: treasureInitialization,
        name: 'initialize treasure',
        description: '',
        categories: []
    },
    {
        test: girlShowShort,
        name: 'girl show short',
        description: '',
        categories: []
    },
    {
        test: girlShowLong,
        name: 'girl show long',
        description: '',
        categories: []
    }
];
