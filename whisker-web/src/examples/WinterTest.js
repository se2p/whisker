const schorschInitialization = async function (t) {
    await t.runForTime(5);
    let schorsch = t.getSprite('Schorsch');
    t.assert.ok(schorsch.visible, 'Schorsch must be visible');
    t.end();
};

const stellaInitialization = async function (t) {
    await t.runForTime(5);
    let stella = t.getSprite('Stella');
    t.assert.ok(stella.visible, 'Stella must be visible');
    t.end();
};


const stellaStopping = async function (t) {
    await t.runForTime(3);
    let stella = t.getSprite('Stella');
    let xOrigStella = stella.x;
    let yOrigStella = stella.y;
    let dirStella = stella.direction;
    let stellaMove = false;
    let stellaStopped = false;
    let changedDir = false;
    let finishedDir = false;
    let xStella = stella.x;
    let yStella = stella.y;
    let stellaFinished = false;
    t.onSpriteMoved(() => {
        if (stella.x !== xStella || stella.y !== yStella) {
            xStella = stella.x;
            yStella = stella.y;
            stellaMove = true;
            stellaStopped = false;
        } else if (stellaMove === true) {
            stellaStopped = true;
        }
        if (stella.direction !== dirStella) {
            changedDir = true;
            finishedDir = false;
        }
        if (stella.direction === dirStella && changedDir) {
            finishedDir = true;
        }
        if (finishedDir && stellaStopped && stella.x <= (xOrigStella + 1) && stella.x >= (xOrigStella - 1) && stella.y <= (yOrigStella + 1) && stella.y >= (yOrigStella - 1)) {
            stellaFinished = true;
        }
    });
    await t.runUntil(() => stellaFinished, 20000);
    t.assert.ok(stellaFinished, "stella must have finsihed");
    t.assert.ok(stella.direction === dirStella, "stella must have direction from start");
    t.assert.ok(stella.x <= (xOrigStella + 1) && stella.x >= (xOrigStella - 1) && stella.y <= (yOrigStella + 1) && stella.y >= (yOrigStella - 1), "stella must have returned");
    await t.runForTime(10);
    stellaFinished = false
    stellaMove = false;
    stellaStopped = false;
    changedDir = false;
    finishedDir = false;
    t.assert.ok(stella.direction === dirStella, "stella changed direction after finish");
    t.assert.ok(stella.x <= (xOrigStella + 1) && stella.x >= (xOrigStella - 1) && stella.y <= (yOrigStella + 1) && stella.y >= (yOrigStella - 1), "stella moved after finish");
    t.end();
};

const schorschDrawing = async function (t) {
    await t.runForTime(3);
    let schorsch = t.getSprite('Schorsch');
    let stella = t.getSprite('Stella');
    let xOrigSchorsch = schorsch.x;
    let yOrigSchorsch = schorsch.y;
    let xOrigStella = stella.x;
    let yOrigStella = stella.y;
    let dirStella = stella.direction;
    let stellaMove = false;
    let stellaStopped = false;
    let changedDir = false;
    let finishedDir = false;
    let xStella = stella.x;
    let yStella = stella.y;
    let stellaFinished = false;
    let schorschMoved = false;
    t.onSpriteMoved(() => {
        if (stella.x !== xStella || stella.y !== yStella) {
            xStella = stella.x;
            yStella = stella.y;
            stellaMove = true;
            stellaStopped = false;
        } else if (stellaMove === true) {
            stellaStopped = true;
        }
        if (stella.direction !== dirStella) {
            changedDir = true;
            finishedDir = false;
        }
        if (stella.direction === dirStella && changedDir) {
            finishedDir = true;
        }
        if (finishedDir && stellaStopped && stella.x <= (xOrigStella + 1) && stella.x >= (xOrigStella - 1) && stella.y <= (yOrigStella + 1) && stella.y >= (yOrigStella - 1)) {
            stellaFinished = true;
        }
        if (xOrigSchorsch !== schorsch.x || yOrigSchorsch !== schorsch.y) {
            schorschMoved = true;
        }
    });
    await t.runUntil(() => stellaFinished, 1600);
    t.assert.ok(!schorschMoved, "schorsch moved too soon");
    schorschMoved = false;
    t.onSpriteMoved(() => {
        if (xOrigSchorsch !== schorsch.x || yOrigSchorsch !== schorsch.y) {
            schorschMoved = true;
        }
    });
    await t.runForTime(6500);
    t.assert.ok(schorschMoved, "schorsch didn't move");
    t.assert.ok(schorsch.x <= (xOrigSchorsch + 1) && schorsch.x >= (xOrigSchorsch - 1) && schorsch.y <= (yOrigSchorsch + 1) && schorsch.y >= (yOrigSchorsch - 1), "schorsch must return");
    t.assert.ok(!t.isProjectRunning(), "project must not run");
    t.end();
};

module.exports = [
    {
        test: schorschInitialization,
        name: 'initialize schorsch',
        description: '',
        categories: []
    },
    {
        test: stellaInitialization,
        name: 'initialize stella',
        description: '',
        categories: []
    },
    {
        test: stellaStopping,
        name: 'stella stopping',
        description: '',
        categories: []
    },
    {
        test: schorschDrawing,
        name: 'schorsch drawing',
        description: '',
        categories: []
    }
];
