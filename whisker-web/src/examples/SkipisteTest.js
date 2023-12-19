const catInitialization = async function (t) {
    await t.wait(2);
    let cat = t.getSprite('Skikatze');
    t.assert.ok(cat.visible, 'cat must be visible');
    t.end();
};

const treeInitialization = async function (t) {
    await t.wait(2);
    let tree = t.getSprite('Hindernis');
    t.assert.ok(!tree.visible, 'tree must not be visible');
    t.end();
};

const catMoving = async function (t) {
    await t.wait(2);
    let cat = t.getSprite('Skikatze');
    let catX = cat.x;
    await t.wait(20);
    t.assert.ok(catX < cat.x, "cat must move right");
    catX = cat.x;
    t.keyPress('left arrow', 30);
    await t.wait(30);
    t.assert.ok(catX > cat.x, "cat must move left");
    catX = cat.x;
    await t.wait(20);
    t.assert.ok(catX < cat.x, "cat must move right again");
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
        test: treeInitialization,
        name: 'initialize tree',
        description: '',
        categories: []
    },
    {
        test: catMoving,
        name: 'cat moving',
        description: '',
        categories: []
    }
];
