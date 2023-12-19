const parrotInitialization = async function (t) {
    await t.wait(5);
    let parrot = t.getSprite('Papagei');
    t.assert.ok(parrot.visible, 'Parrot must be visible');
    t.end();
};

const milkInitialization = async function (t) {
    await t.wait(5);
    let milk = t.getSprite('Milch');
    t.assert.ok(milk.visible, 'Milk must be visible');
    t.end();
};

const parrotStoppingAtMilk = async function (t) {
    await t.wait(5);
    let milk = t.getSprite('Milch');
    let parrot = t.getSprite('Papagei');
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && parrot.isTouchingSprite(milk.name)) {
            touched = true;
        }
    });
    await t.runUntil(() => touched  === true, 10000);
    let origX = parrot.x;
    let origY = parrot.y;
    t.assert.ok(touched, "parrot must have touched milk");
    await t.wait(5);
    t.assert.ok(origX===parrot.x,'Parrot must not move');
    t.assert.ok(origY===parrot.y,'Parrot must not move')
    t.assert.ok(parrot.sayText.includes("Lecker"), "parrot did not say lecker");
    await t.runForTime(3000);
    t.assert.ok(!t.isProjectRunning(), "project must not run");
    t.end();
};

module.exports = [
    {
        test: parrotInitialization,
        name: 'Parrot visible',
        description: '',
        categories: []
    },
    {
        test: milkInitialization,
        name: 'Milk visible',
        description: '',
        categories: []
    },
    {
        test: parrotStoppingAtMilk,
        name: 'Parrot stops at milk',
        description: '',
        categories: []
    }
];
