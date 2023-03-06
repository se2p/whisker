const ballInitialization = async function (t) {
    await t.runForTime(5);
    let ball = t.getSprite('Ball');
    t.assert.ok(ball.visible, 'ball must be visible');
    t.end();
};

const paddleInitialization = async function (t) {
    await t.runForTime(5);
    let paddle = t.getSprite('Spieler');
    t.assert.ok(paddle.visible, 'player must be visible');
    t.end();
};

const computerInitialization = async function (t) {
    await t.runForTime(5);
    let paddle = t.getSprite('Computer');
    t.assert.ok(paddle.visible, 'computer must be visible');
    t.end();
};

const outInitialization = async function (t) {
    await t.runForTime(5);
    let out = t.getSprite('Aus-Linie Spieler');
    t.assert.ok(out.visible, 'out player must be visible');
    t.end();
};

const outComputerInitialization = async function (t) {
    await t.runForTime(5);
    let out = t.getSprite('Aus-Linie Computer');
    t.assert.ok(out.visible, 'out computer must be visible');
    t.end();
};

const ballOut = async function (t) {
    await t.runForTime(5);
    let stage = t.getStage();
    let score = stage.getVariable('Meine Punkte');
    let state = stage.getVariable('Status');
    if (parseInt(score.value, 10) <= 1){
        t.assert.ok(state.value.startsWith('Anf'), 'score <= 1 but not Anf');
    }
    if (parseInt(score.value, 10) > 1) {
        t.assert.ok(state.value === 'Experte', 'score >1 but not Experte at beginning');
        t.clickSprite('Reset', 20);
        await t.runForTime(50);
        t.assert.ok(score.value === '0', "score must be 0 after reset");
        t.assert.ok(state.value.startsWith('Anf'), "score ==0 but not Anf");
    }

    t.assert.ok(state.value.startsWith('Anf'), "score <=1 but not Anf");
    let ball = t.getSprite('Ball');
    let paddle = t.getSprite('Spieler');
    t.clickSprite('Reset', 5);
    await t.runForTime(10);

    t.assert.ok(score.value === '0', "score must be 0 after reset");
    t.assert.ok(state.value.startsWith('Anf'), "score ==0 but not Anf");

    t.addCallback(() => {
        if (Math.abs(paddle.y - ball.y) <= 10) {
            if (t.isKeyDown('up arrow')) {
                t.keyPress('up arrow');
            }
            if (t.isKeyDown('down arrow')) {
                t.keyPress('down arrow');
            }
        } else if (paddle.y > ball.y) {
            t.keyPress('up arrow');
            t.keyPress('down arrow');
        } else if (paddle.y < ball.y) {
            t.keyPress('down arrow');
            t.keyPress('up arrow');
        }

    });

    while (parseInt(score.value, 10) < 2) {
        if (!t.isProjectRunning()) {
            t.greenFlag();
            await t.runForTime(10);
            t.assert.ok(t.isProjectRunning(), "project must run");
            t.assert.ok(state.value.startsWith('Anf'), "score <= 1 but not Anf");
        }
        await t.runUntil(() => !t.isProjectRunning(), 60000);
        t.assert.ok(!t.isProjectRunning(), "project must not run");
    }

    t.assert.ok(parseInt(score.value, 10) > 1, "score must be bigger than 1");
    t.assert.ok(state.value === 'Experte', "score >1 but not Experte");


    t.end();
};

module.exports = [
    {
        test: ballInitialization,
        name: 'initialize ball',
        description: '',
        categories: []
    },
    {
        test: paddleInitialization,
        name: 'initialize paddle',
        description: '',
        categories: []
    },
    {
        test: computerInitialization,
        name: 'initialize computer',
        description: '',
        categories: []
    },
    {
        test: outInitialization,
        name: 'initialize out',
        description: '',
        categories: []
    },
    {
        test: outComputerInitialization,
        name: 'initialize out computer',
        description: '',
        categories: []
    },
    {
        test: ballOut,
        name: 'set state according to score',
        description: '',
        categories: []
    }
];
