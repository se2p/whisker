const catInitialization = async function (t) {
    await t.runForTime(2);
    let cat = t.getSprite('Katze');
    t.assert.ok(cat.visible, 'cat must be visible');
    t.end();
};

const teraInitialization = async function (t) {
    await t.runForTime(2);
    let tera = t.getSprite('Tera');
    t.assert.ok(!tera.visible, 'tera must not be visible');
    t.end();
};

const teraConstantMove = async function (t) {
    await t.runForTime(2);
    let tera = t.getSprite('Tera');
    let teraX = tera.x;
    let teraY = tera.y;
    let teraMoved = false;
    t.addCallback(() => {
        t.assert.ok(!tera.visible, "tera went visible");
        if (teraX !== tera.x || teraY !== tera.y) {
            teraMoved = true;
        }
    });
    for (let i = 0; i < 50; i++) {
        await t.runForTime(10);
        t.assert.ok(teraMoved, "tera did not move " + i);
        teraX = tera.x;
        teraY = tera.y;
        teraMoved = false;
    }
    t.end();
};

module.exports = [
    {
        test: catInitialization,
        name: 'initialize cat',
        description: '',
        categories: []
    },
    {
        test: teraInitialization,
        name: 'initialize tera',
        description: '',
        categories: []
    },
    {
        test: teraConstantMove,
        name: 'tera move',
        description: '',
        categories: []
    }
];
