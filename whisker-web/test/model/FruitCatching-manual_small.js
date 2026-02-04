/* eslint-disable eqeqeq */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */

// ==================== Helper Functions =======================================

const isBowl = sprite => sprite.name.toLowerCase().match(/bowl/);
const isApple = sprite => sprite.name.toLowerCase().match(/(apfel|apple)/);
const isBanana = sprite => sprite.name.toLowerCase().match(/banan/);
const isTime = sprite => sprite.name.toLowerCase().match(/(zeit|time)/);
const isScore = sprite => sprite.name.toLowerCase().match(/(punkt|point|score)/);
const gameOverRegex = /(end|over|game over|ende!|game over!)/;

/**
 * Follows a sprite with the bowl by simulating left and right arrow key presses.
 * Tries to move the bowl to the same x position as the sprite.
 * Works with "good" movement (i.e. "if key pressed" in a loop) and "bad" movement (i.e. "when key pressed" hats).
 * @param {TestDriver} t The test driver.
 * @param {number} bowlX The x coordinate of the bowl,
 * @param {number} spriteX The x coordinate of the sprite to follow.
 */
const followSprite = function (t, bowlX, spriteX) {
    /* Stop if the bowl is near enough. */
    if (Math.abs(bowlX - spriteX) <= 10) {
        if (t.isKeyDown('Left')) {
            t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        }
        if (t.isKeyDown('Right')) {
            t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        }

    } else if (bowlX > spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

    } else if (bowlX < spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});
    }
};


/**
 * Dodges a sprite with the bowl by simulating left and right arrow key presses.
 * Tries to move the bowl to the other half of the screen as the sprite, until it is far enough away.
 * Works with "good" movement (i.e. "if key pressed" in a loop) and "bad" movement (i.e. "when key pressed" hats).
 * @param {TestDriver} t The test driver.
 * @param {number} bowlX The x coordinate of the bowl,
 * @param {number} spriteX The x coordinate of the sprite to dodge.
 */
const dodgeSprite = function (t, bowlX, spriteX) {
    const {width} = t.getStageSize();

    /* Stop if the sprite is already (screenWidth / 4) away from the bowl. */
    if (Math.abs(bowlX - spriteX) >= (width / 4)) {
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});

    } else {
        const outerX = (width * 3) / 8;
        if (spriteX >= 0) {
            followSprite(t, bowlX, -outerX);
        } else {
            followSprite(t, bowlX, +outerX);
        }
    }
};

/**
 * Returns the newest clone of the given sprite/clone, or the sprite/clone itself, if it is the newest clone or there
 * are no clones of the sprite.
 * @param {Sprite} sprite The sprite.
 * @return {Sprite} The newest clone of the given sprite.
 */
const getNewestClone = function (sprite) {
    const newClones = sprite.getNewClones();
    if (newClones.length) {
        /* There should not be more than one new clone after one execution step. */
        return newClones[0];
    }
    return sprite;
};

/**
 * Waits until a sprite, which matches a condition, appears on the top of the screen (y > 100). Then returns the sprite.
 * @param {TestDriver} t The test driver.
 * @param {match} spriteCondition A condition hat describes what sprite to wait for.
 * @param {number} timeout A timeout. If the sprite is not detected before the timeout, null is returned.
 * @return {Promise<(Sprite|null)>} The detected Sprite, or null if it wasn't detected.
 */
const waitForSpriteOnTop = async function (t, spriteCondition, timeout) {
    let sprite = null;
    await t.runUntil(() => {
        const sprites = t.getSprites(s => spriteCondition(s) && s.visible && s.y > 100);
        if (sprites.length > 0) {
            sprite = sprites[0];
        }
        return sprites.length > 0;
    }, timeout);
    return sprite;
};

/**
 * Checks if a given sprite touches the bowl or the ground (red line).
 * @param {Sprite} sprite The sprite.
 * @param {Sprite} bowl The bowl.
 * @return {(string|boolean)} 'bowl', 'ground' or false, depending on if the sprite touches the bowl, ground or nothing.
 */
const spriteTouchingGround = function (sprite, bowl) {
    if (sprite.visible && sprite.exists) {
        if (sprite.isTouchingColor([255, 0, 0])) {
            return 'ground';
        } else if (sprite.isTouchingSprite(bowl.name)) {
            return 'bowl';
        }
    }
    return false;
};

// ==================== Tests ==================================================

// -------------------- Initialization -----------------------------------------

const testVariableInitialization = async function (t) {
    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const time = t.getStage().getVariables(isTime)[0];
    t.assume.ok(typeof time !== 'undefined', 'Could not find variable time.');

    const score = t.getStage().getVariables(isScore)[0];
    t.assume.ok(typeof score !== 'undefined', 'Could not find variable score.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------

    /* Give the program seed time to initialize. */
    await t.runUntil(() => (time.value == 30 || time.value == 29) && score.value == 0, 500);

    t.assert.ok(time.value == 30 || time.value == 29, 'Time must start at 30 seconds.');
    t.assert.equal(score.value, 0, 'Score must start at 0.');

    t.end();
};

// -------------------- Bowl Movement ------------------------------------------

const testMoveBowl = async function (t) {
    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
    t.assume.ok(typeof bowl !== 'undefined', 'Could not find sprite bowl.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, );

    let bowlX;

    /* Give the program some time to initialize . */
    await t.runForTime(250);


    /* Test movement when no key is pressed. */
    bowlX = bowl.x;
    await t.runForTime(250);
    t.assume.equal(bowl.x, bowlX, 'Bowl must not move when no key is pressed.');

    /* Test movement when left arrow key is pressed. */
    t.inputImmediate({
        device: 'keyboard',
        key: 'Left',
        isDown: true,
        duration: 50
    });
    bowlX = bowl.x;
    await t.runForTime(250);
    t.assert.less(bowl.x, bowlX, 'Bowl must move to the left when left arrow key is pressed.');

    /* Test movement when right arrow key is pressed. */
    t.inputImmediate({
        device: 'keyboard',
        key: 'Right',
        isDown: true,
        duration: 50
    });
    bowlX = bowl.x;
    await t.runForTime(250);
    t.assert.greater(bowl.x, bowlX, 'Bowl must move to the right when right arrow key is pressed.');

    t.end();
};

// -------------------- Fruit Falling ------------------------------------------

const testAppleFalling = async function (t) {

    // -------------------------------- BEGIN INLINED CALL to testFruitFalling(t, isApple, 'Apple', -5, false) --------------------------------

    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
    t.assume.ok(typeof bowl !== 'undefined', 'Could not find sprite bowl.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, );

    /* Clear out new sprites. */
    t.getNewSprites();

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Wait until a fruit shows at the top of the screen. */
    let fruit = await waitForSpriteOnTop(t, isApple, 5000);
    t.assert.ok(fruit !== null, 'Apple', ' must appear on the top of the screen after 5 seconds.');

    /* Save the position at which the fruit is detected. */
    let fruitPos = fruit.pos;

    /* Cancel the run when the fruit touches the bowl or ground, can't be done with addCallback() because the
     * sprite can touch the bowl and be reset in the same step. */
    const onMoved = () => {
        if (spriteTouchingGround(fruit, bowl)) {
            t.cancelRun();
        }
    };

    /* If clones are used, always use the newest clone. */
    t.addCallback(() => {
        const newFruit = getNewestClone(fruit);
        if (newFruit !== fruit) {
            fruit.onMoved = null;
            newFruit.onMoved = onMoved;
            fruitPos = newFruit.pos;
            newFruit.updateOld();
            fruit = newFruit;
        }
    }, true);

    fruit.updateOld();
    fruit.onMoved = onMoved;

    await t.runForTime(5000);

    /* Check if the fruit moved down.
     * Use fruit.old.y because the fruit could have already been moved to the top again. */
    t.assert.less(fruit.old.y, fruitPos.y, 'Apple', ' must fall down.');

    t.end();

    // -------------------------------- END INLINED CALL to testFruitFalling(t, isApple, 'Apple', -5, false) --------------------------------
};

// -------------------- Fruit Spawn --------------------------------------

const testAppleSpawn = async function (t) {
    // await testFruitSpawn(t, isApple, 'Apple', false);

    // -------------------------------- BEGIN INLINED CALL to testFruitSpawn(t, isApple, 'Apple', false) --------------------------------


    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------


    const bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
    t.assume.ok(typeof bowl !== 'undefined', 'Could not find sprite bowl.');

    let apple = t.getSprites(s => s.isOriginal && isApple(s))[0];
    t.assume.ok(typeof apple !== 'undefined', 'Could not find sprite apple.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, ['bowl', 'apple']);

    /* Clear out new sprites. */
    t.getNewSprites();

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Catch apples with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    let oldFruits = t.getSprites(sprite => sprite.visible && isApple(sprite) && sprite.y > 100);
    const fruitSpawnPositions = [];

    /* Detect fruit spawns by checking if any new fruit appears on the top of the screen each step.
     * Save the spawn position for detected fruits. */
    t.addCallback(() => {
        let fruits = t.getSprites(sprite => isApple(sprite) && sprite.visible && sprite.y > 100);

        /* Filter out duplicate sprites on the same position. */
        for (const fruit of [...fruits]) {
            fruits = fruits.filter(s => s === fruit || (s.x !== fruit.x && s.y !== fruit.y));
        }

        /* Save the position of new fruits. */
        for (const fruit of fruits) {
            if (oldFruits.indexOf(fruit) === -1) {
                fruitSpawnPositions.push(fruit.pos);
            }
        }

        oldFruits = fruits;
    });

    await t.runUntil(() => fruitSpawnPositions.length >= 3, 30000);

    t.assert.greaterOrEqual(fruitSpawnPositions.length, 3,
        'At least three ', 'Apple', 's must have spawned after 30 seconds.');

    t.end();

    // -------------------------------- END INLINED CALL to testFruitSpawn(t, isApple, 'Apple', false) --------------------------------
};

// -------------------- Fruit Interaction ---------------------------------

const testAppleGameOver = async function (t) {
    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
    t.assume.ok(typeof bowl !== 'undefined', 'Could not find sprite bowl.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, ['bowl']);

    let appleTouched = false;

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Wait until an apple appears in the top half of the screen. */
    let apple = await waitForSpriteOnTop(t, isApple, 5000);
    t.assume.ok(apple !== null, 'An apple must appear on the top of the screen after five seconds.');

    /* Catch the apple with the bowl.
     * Always use the newest apple clone. */
    const playCallback = t.addCallback(() => {
        apple = getNewestClone(apple);
        dodgeSprite(t, bowl.x, apple.x);
    });

    /* Cancel the run when the apple touches the bowl or the red line.
     * Can't be done with addCallback() because the sprite can touch the bowl and be reset in the same step. */
    t.onSpriteMoved(sprite => {
        if (!appleTouched && isApple(sprite)) {
            appleTouched = spriteTouchingGround(sprite, bowl);
            if (appleTouched) {
                t.cancelRun();
            }
        }
    });

    /* Run until the apple touches the ground or the bowl. */
    await t.runForTime(10000);
    t.assume.equal(appleTouched, 'ground', 'Apple must have touched the ground after five seconds.');

    /* Give the program some time to stop. */
    await t.runForTime(2000);
    playCallback.disable();
    t.resetKeyboard();
    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const banana = t.getSprites(s => s.isOriginal && isBanana(s))[0];
    t.assume.ok(typeof banana !== 'undefined', 'Could not find sprite banana.');

    const time = t.getStage().getVariables(isTime)[0];
    t.assume.ok(typeof time !== 'undefined', 'Could not find variable time.');

    const score = t.getStage().getVariables(isScore)[0];
    t.assume.ok(typeof score !== 'undefined', 'Could not find variable score.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, ['banana', 'time', 'score']);
    t.addConstraint(() => {
        for (const appleInstance of apple.getClones(true)) {
            t.assert.equal(appleInstance.x, appleInstance.old.x,
                'Apple must not move after game is over (should be over).');
        }
        for (const bananaInstance of banana.getClones(true)) {
            t.assert.equal(bananaInstance.x, bananaInstance.old.x,
                'Bananas must not move after game is over (should be over).');
        }
    });
    t.addConstraint(() => {
        t.assert.equal(time.value, time.old.value, 'Time must not change after game is over (should be over).');
        t.assert.equal(score.value, score.old.value, 'Score must not change after game is over (should be over).');
    });
    await t.runForTime(1000);

    t.end();
};

// -------------------- Timer --------------------------------------------------
const testTimerGameOverMessage = async function (t) {
    t.seedScratch('seed');

    // -------------------------------- BEGIN INLINED CALL to getSpritesAndVariables --------------------------------

    const bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
    t.assume.ok(typeof bowl !== 'undefined', 'Could not find sprite bowl.');

    let apple = t.getSprites(s => s.isOriginal && isApple(s))[0];
    t.assume.ok(typeof apple !== 'undefined', 'Could not find sprite apple.');

    // -------------------------------- END INLINED CALL to getSpritesAndVariables --------------------------------(t, ['bowl', 'apple']);

    /* Play the game, so the timer can tick long enough. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    const timeElapsed = await t.runUntil(() => bowl.sayText, 40000);
    t.assert.ok(bowl.sayText, 'Bowl must display a message when the time is up.');
    t.assert.matches(bowl.sayText.toLowerCase(), gameOverRegex, 'Bowl must display \'Ende!\' when the time is up.');
    t.assert.greaterOrEqual(timeElapsed, 20000, 'Game over message must not appear before 20 seconds.');

    await t.runForTime(500);
    t.assert.ok(bowl.sayText, 'Bowl\'s game over message must last for one second.');

    await t.runUntil(() => !bowl.sayText, 500);
    t.assert.not(bowl.sayText, 'Bowl\'s game over message must disappear after one second');

    t.end();
};

/*
 * Categories:
 * -----------
 *
 * bowl
 * apple
 * banana
 * time
 * score
 *
 * initialization
 * bowl movement
 * fruit falling
 * fruit spawn
 * fruit interaction
 * timer
 *
 * input
 * constraints
 * slow
 */

module.exports = [
    { // 01
        test: testVariableInitialization,
        name: 'Variable Initialization Test',
        description: 'Tests the initialization of variable values for time and score. Time must start at 30, score must start at 0',
        categories: ['initialization', 'time', 'score']
    },

    { // 04
        test: testMoveBowl,
        name: 'Bowl Movement Test',
        description: 'Tests the movement of the bowl sprite. The bowl must move in the respective direction when the left or right arrow key is pressed, and must not move if no arrow key is pressed.',
        categories: ['bowl movement', 'bowl', 'input']
    },

    { // 06
        test: testAppleFalling,
        name: 'Apple Falling Test',
        description: 'Tests if the apple falls down from the top of the screen.',
        categories: ['fruit falling', 'apple']
    },

    { // 10
        test: testAppleSpawn,
        name: 'Apple Spawn Test',
        description: 'Tests if apples spawn again after falling down.',
        categories: ['fruit spawn', 'apple', 'input']
    },

    { // 21
        test: testAppleGameOver,
        name: 'Apple Game Over Test',
        description: 'Tests if an apples falling to the ground end the game.',
        categories: ['fruit interaction', 'apple', 'input']
    },

    { // 28
        test: testTimerGameOverMessage,
        name: 'Timer Game Over Message Test',
        description: 'Tests if the game displays a game over message after the time limit is reached.',
        categories: ['timer', 'time', 'input', 'slow']
    }
];
