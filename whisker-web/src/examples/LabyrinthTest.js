const playerInitialization = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let player = t.getSprite('Spieler');
    t.assert.ok(player.visible, 'Player must be visible');
    t.end();
};

const moneyInitialization = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let money = t.getSprite('Münzen');
    t.assert.ok(money.visible, 'Money must be visible');
    t.end();
};

const friendInitialization = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let friend = t.getSprite('Freundin');
    t.assert.ok(friend.visible, 'Friend must be visible');
    t.end();
};

const superAfterMoney = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let player = t.getSprite('Spieler');
    let money = t.getSprite('Münzen');
    let friend = t.getSprite('Freundin');
    let done = false;
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && money.isTouchingSprite(player.name)) {
            touched = true;
        }
    });
    await t.runUntil(() => touched, 60000);
    t.assert.ok(touched, 'player did not touch money');
    t.addCallback(() => {
        if (!done && friend.sayText.includes('Super')) {
            done = true;
        }
    });
    await t.runForTime(3000);
    t.assert.ok(done, 'text must have changed a final time');
    t.end();
}

const noSuperTillMoney = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let player = t.getSprite('Spieler');
    let money = t.getSprite('Münzen');
    let friend = t.getSprite('Freundin');
    let fail = false;
    let touched = false;
    t.onSpriteMoved(() => {
        if (!fail && friend.sayText.includes('Super')) {
            fail = true;
        }
        if (!touched && money.isTouchingSprite(player.name)) {
            touched = true;
        }
    });
    await t.runUntil(() => touched || fail, 60000);
    t.assert.ok(!fail, 'text must not change until touching money');
    t.assert.ok(touched, 'player did not touch money');
    t.end();
}

const rightStart = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let friend = t.getSprite('Freundin');
    await t.wait(10);
    t.assert.ok(friend.sayText.includes('Auf geht'), 'text show at beginning');
    t.end();
}

const noStartAfterMoney = async function (t) {
    await t.wait(2);
    let stage = t.getStage();
    while (stage.currentCostume !== 3) {
        t.end();
        t.seedScratch('~zzzzz');
        t.greenFlag();
        await t.wait(2);
    }
    let player = t.getSprite('Spieler');
    let money = t.getSprite('Münzen');
    let friend = t.getSprite('Freundin');
    let fail = false;
    let touched = false;
    t.onSpriteMoved(() => {
        if (!touched && money.isTouchingSprite(player.name)) {
            touched = true;
        }
    });
    await t.runUntil(() => touched === true, 60000);
    t.assert.ok(touched, 'player did not touch money');
    t.addCallback(() => {
        if (!fail && friend.sayText.includes('Auf geht')) {
            fail = true;
        }
    });
    await t.wait(10);
    t.assert.ok(!fail, 'beginning text after money touch');
    t.end();
}

module.exports = [
    {
        test: playerInitialization,
        name: 'Player visible',
        description: '',
        categories: []
    },
    {
        test: moneyInitialization,
        name: 'Money visible',
        description: '',
        categories: []
    },
    {
        test: friendInitialization,
        name: 'Friend visible',
        description: '',
        categories: []
    },
    {
        test: superAfterMoney,
        name: 'Player touches Money',
        description: '',
        categories: []
    },
    {
        test: rightStart,
        name: 'text show at beginning',
        description: '',
        categories: []
    },
    {
        test: noSuperTillMoney,
        name: 'super not show at beginning',
        description: '',
        categories: []
    },
    {
        test: noStartAfterMoney,
        name: 'beginning text not after player money touch',
        description: '',
        categories: []
    }
];
