const fishInitialization = async function (t) {
    await t.wait(5);
    let fish = t.getSprite('Fisch');
    t.assert.ok(fish.visible, 'fisch must be visible');
    t.end();
};

const starInitialization = async function (t) {
    await t.wait(5);
    let star = t.getSprite('Stern');
    t.assert.ok(star.visible, 'star must be visible');
    t.end();
};

const pufferfishInitialization = async function (t) {
    await t.wait(5);
    let pufferfish = t.getSprite('Kugelfisch');
    t.assert.ok(pufferfish.visible, 'pufferfish must be visible');
    t.end();
};

const jellyfishInitialization = async function (t) {
    await t.wait(5);
    let jellyfish = t.getSprite('Qualle');
    t.assert.ok(jellyfish.visible, 'jellyfish must be visible');
    t.end();
};

const starIncreasePointAndChangeLocationInitialization = async function (t) {
    const dist = function (sprite1, sprite2) {
        const distX = sprite1.x - sprite2.x;
        const distY = sprite1.y - sprite2.y;
        return Math.sqrt(distX * distX + distY * distY);
    };
    t.mouseMove(-200, -170, 40);
    await t.wait(3);
    let star = t.getSprite('Stern');
    let fish = t.getSprite('Fisch');
    let jellyfish = t.getSprite('Qualle');
    let pufferfish = t.getSprite('Kugelfisch');
    let stage = t.getStage();
    let points = stage.getVariable('Punkte');

    let distOk = false;
    for (let i = 0; i < 2; i++) {
        let valueOrig = points.value;
        let xOrig = star.x;
        let yOrig = star.y;
        distOk = false;
        t.onSpriteMoved(() => {
            if (dist(jellyfish, fish) < 100
                || dist(pufferfish, fish) < 100) {
                const {width, height} = t.getStageSize();
                let newX = fish.x <= 0 ? width / 2 : -1 * width / 2;
                let newY = fish.y <= 0 ? height / 2 : -1 * height / 2;
                t.mouseMove(newX, newY);
            }
            if (!distOk
                && dist(jellyfish, star) >= 100
                && dist(pufferfish, star) >= 80) {
                distOk = true;
            }
        });
        await t.runUntil(() => distOk === true, 25000);
        t.mouseMove(star.x, star.y, 40);
        let touched = false;
        t.onSpriteMoved(() => {
            if (!touched && star.isTouchingSprite(fish.name)) {
                touched = true;
            }
        });
        await t.runUntil(() => touched === true, 4000);
        await t.runForTime(300);
        t.assert.ok(parseInt(points.value, 10) > valueOrig, 'points did not increase' + i);
        t.assert.ok(star.x !== xOrig || star.y !== yOrig, 'star did not move' + i);
    }
    t.end();
};


module.exports = [
    {
        test: fishInitialization,
        name: 'initialize fish',
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
        test: jellyfishInitialization,
        name: 'initialize jellyfish',
        description: '',
        categories: []
    },
    {
        test: pufferfishInitialization,
        name: 'initialize pufferfish',
        description: '',
        categories: []
    },
    {
        test: starIncreasePointAndChangeLocationInitialization,
        name: 'fish touch star',
        description: '',
        categories: []
    }
];
