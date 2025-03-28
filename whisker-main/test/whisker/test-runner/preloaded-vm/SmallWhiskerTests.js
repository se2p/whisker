const testMoveLeft = async function (t) {
    const sprite1 = t.getSprite('Sprite1');
    t.assert.equal(sprite1.x, 0);

    t.keyPress('left arrow', 1);
    await t.runForSteps(1);

    t.assert.equal(sprite1.x, -10);
    t.end();
};

const testMoveRight = async function (t) {
    const sprite1 = t.getSprite('Sprite1');
    t.assert.equal(sprite1.x, 0);

    t.keyPress('right arrow', 1);
    await t.runForSteps(1);

    t.assert.equal(sprite1.x, 10);
    t.end();
};

module.exports = [
    {
        test: testMoveLeft,
        name: 'test sprite moving left',
        description: 'Tests if the sprite moves to the left if the left arrow key is pressed.',
        categories: []
    },
    {
        test: testMoveRight,
        name: 'test sprite moving right',
        description: 'Tests if the sprite moves to the right if the right arrow key is pressed.',
        categories: []
    }
];
