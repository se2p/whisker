/* eslint-disable eqeqeq */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */

// ==================== Helper Functions =======================================

const isBowl = sprite => sprite.name.toLowerCase().match(/bowl/);
const isApple = sprite => sprite.name.toLowerCase().match(/(apfel|apple)/);
const isBanana = sprite => sprite.name.toLowerCase().match(/banan/);
const isTime = sprite => sprite.name.toLowerCase().match(/(zeit|time)/);
const isScore = sprite => sprite.name.toLowerCase().match(/(punkt|point|score)/);
const gameOverRegex = /(end|over)/;

/**
 * Retrieves requested sprites and variables used in the program by their name.
 * @param {TestDriver} t The test driver.
 * @param {string[]} request A list containing the names of sprites to retrieve.
 * @return {{stage: Sprite, bowl: Sprite, apple: Sprite, banana: Sprite, time: Variable, score: Variable}}
 *         The sprites and variables.
 */
const getSpritesAndVariables = function (t, request) {
    const rv = {};
    rv.stage = t.getStage();

    if (request.indexOf('bowl') !== -1) {
        rv.bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
        t.assume.ok(typeof rv.bowl !== 'undefined', 'Could not find sprite bowl.');
    }

    if (request.indexOf('apple') !== -1) {
        rv.apple = t.getSprites(s => s.isOriginal && isApple(s))[0];
        t.assume.ok(typeof rv.apple !== 'undefined', 'Could not find sprite apple.');
    }

    if (request.indexOf('banana') !== -1) {
        rv.banana = t.getSprites(s => s.isOriginal && isBanana(s))[0];
        t.assume.ok(typeof rv.banana !== 'undefined', 'Could not find sprite banana.');
    }

    if (request.indexOf('time') !== -1) {
        rv.time = rv.stage.getVariables(isTime)[0];
        t.assume.ok(typeof rv.time !== 'undefined', 'Could not find variable time.');
    }

    if (request.indexOf('score') !== -1) {
        rv.score = rv.stage.getVariables(isScore)[0];
        t.assume.ok(typeof rv.score !== 'undefined', 'Could not find variable score.');
    }

    return rv;
};

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
        if (t.isKeyDown('left arrow')) {
            t.keyRelease('left arrow');
        }
        if (t.isKeyDown('right arrow')) {
            t.keyRelease('right arrow');
        }

    } else if (bowlX > spriteX) {
        t.keyRelease('right arrow');
        t.keyPress('left arrow');

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.keyRelease('left arrow');
        t.keyPress('left arrow');

    } else if (bowlX < spriteX) {
        t.keyRelease('left arrow');
        t.keyPress('right arrow');

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.keyRelease('right arrow');
        t.keyPress('right arrow');
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
        t.keyRelease('left arrow');
        t.keyRelease('right arrow');

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
 * Asserts that the game is over by checking that no apple or banana moves and no variable changes for a second.
 * @param {TestDriver} t The test driver.
 * @return {Promise<number>} The time elapsed by the run.
 */
const assertGameOver = async function (t) {
    const {apple, banana, time, score} = getSpritesAndVariables(t, ['apple', 'banana', 'time', 'score']);

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

    return await t.runForTime(1000);
};

/**
 * Runs the program for the given amount of time and checks if an apple or banana moves during that time.
 * @param {TestDriver} t The test driver.
 * @param {number} time The amount of time to run the program for.
 * @return {boolean} If the game is over.
 */
const runForTimeAndCheckIfGameOver = async function (t, time) {
    const {apple, banana} = getSpritesAndVariables(t, ['apple', 'banana']);

    let gameOver = true;
    const detectSpriteMovementCallBack = t.addCallback(() => {
        if (gameOver) {
            for (const appleInstance of apple.getClones(true)) {
                if (appleInstance.visible &&
                    (appleInstance.x !== appleInstance.old.x ||
                     appleInstance.y !== appleInstance.old.y)) {
                    gameOver = false;
                }
            }
            for (const bananaInstance of banana.getClones(true)) {
                if (bananaInstance.visible &&
                    (bananaInstance.x !== bananaInstance.old.x ||
                     bananaInstance.y !== bananaInstance.old.y)) {
                    gameOver = false;
                }
            }
        }
    });

    await t.runForTime(time);
    detectSpriteMovementCallBack.disable();
    return gameOver;
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

    const {time, score} = getSpritesAndVariables(t, ['time', 'score']);

    /* Give the program seed time to initialize. */
    await t.runUntil(() => (time.value == 30 || time.value == 29) && score.value == 0, 500);

    t.assert.ok(time.value == 30 || time.value == 29, 'Time must start at 30 seconds.');
    t.assert.equal(score.value, 0, 'Score must start at 0.');

    t.end();
};

const testBowlInitialization = async function (t) {
    t.seedScratch('seed');

    const {bowl} = getSpritesAndVariables(t, ['bowl']);

    /* Give the program seed time to initialize. */
    await t.runUntil(() => bowl.x === 0 && bowl.y === -145, 500);

    t.assert.equal(bowl.x, 0, 'Bowl must start at x = 0.');
    t.assert.equal(bowl.y, -145, 'Bowl must start at y = -145.');

    t.end();
};

const testFruitInitialization = async function (t) {
    t.seedScratch('seed');

    const {apple, banana} = getSpritesAndVariables(t, ['apple', 'banana']);

    /* Give the program seed time to initialize. */
    await t.runForTime(() => apple.size === 50 && banana.size === 50, 500);

    t.assert.equal(apple.size, 50, 'Apple must have a size of 50%.');
    t.assert.equal(banana.size, 50, 'Banana must have a size of 50%.');

    t.end();
};

// -------------------- Bowl Movement ------------------------------------------

const testMoveBowl = async function (t, testDetails = false) {
    t.seedScratch('seed');

    const {bowl} = getSpritesAndVariables(t, ['bowl']);
    let bowlX;

    /* Give the program some time to initialize . */
    await t.runForTime(250);

    if (testDetails) {
        const bowlY = bowl.y;
        t.addConstraint(() => {
            t.assert.equal(bowl.y, bowlY, 'Bowl must not move vertically.');
        });
        t.addConstraint(() => {
            t.assert.ok(bowl.x === bowl.old.x || Math.abs(bowl.x - bowl.old.x) === 10,
                'Bowl must move in steps of size 10.');
        });
    }

    /* Test movement when no key is pressed. */
    bowlX = bowl.x;
    await t.runForTime(250);
    if (testDetails) {
        t.assert.equal(bowl.x, bowlX, 'Bowl must not move when no key is pressed.');
    } else {
        t.assume.equal(bowl.x, bowlX, 'Bowl must not move when no key is pressed.');
    }

    /* Test movement when left arrow key is pressed. */
    t.keyPress('left arrow', 5);
    bowlX = bowl.x;
    await t.runForTime(250);
    if (testDetails) {
        t.assume.less(bowl.x, bowlX, 'Bowl must move to the left when left arrow key is pressed.');
    } else {
        t.assert.less(bowl.x, bowlX, 'Bowl must move to the left when left arrow key is pressed.');
    }

    /* Test movement when right arrow key is pressed. */
    t.keyPress('right arrow', 5);
    bowlX = bowl.x;
    await t.runForTime(250);
    if (testDetails) {
        t.assume.greater(bowl.x, bowlX, 'Bowl must move to the right when right arrow key is pressed.');
    } else {
        t.assert.greater(bowl.x, bowlX, 'Bowl must move to the right when right arrow key is pressed.');
    }

    t.end();
};

const testMoveBowlDetails = async function (t) {
    t.seedScratch('seed');

    await testMoveBowl(t, true);
    t.end();
};

// -------------------- Fruit Falling ------------------------------------------

const testFruitFalling = async function (t, isFruit, fruitName, fallingSpeed, testDetails = false) {
    t.seedScratch('seed');

    const {bowl} = getSpritesAndVariables(t, ['bowl']);

    /* Clear out new sprites. */
    t.getNewSprites();

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Wait until a fruit shows at the top of the screen. */
    let fruit = await waitForSpriteOnTop(t, isFruit, 5000);
    if (testDetails) {
        t.assume.ok(fruit !== null, fruitName, ' must appear on the top of the screen after 5 seconds.');
    } else {
        t.assert.ok(fruit !== null, fruitName, ' must appear on the top of the screen after 5 seconds.');
    }

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


    /* Add constraint if details should be tested. */
    if (testDetails) {
        t.addConstraint(() => {
            if (fruit.y !== fruit.old.y) {
                t.assert.lessOrEqual(fruit.y, fruit.old.y, fruitName, ' must not move upwards.');
                t.assert.ok((fruit.old.y - fruit.y) % fallingSpeed === 0,
                    fruitName, ' must fall with a speed of ', fallingSpeed, '.');
                t.assert.equal(fruit.x, fruitPos.x, `${fruitName} must fall in a straight line.`);
            }
        });
    }

    fruit.updateOld();
    fruit.onMoved = onMoved;

    await t.runForTime(5000);

    /* Check if the fruit moved down.
     * Use fruit.old.y because the fruit could have already been moved to the top again. */
    if (testDetails) {
        t.assume.less(fruit.old.y, fruitPos.y, fruitName, ' must fall down.');
    } else {
        t.assert.less(fruit.old.y, fruitPos.y, fruitName, ' must fall down.');
    }

    t.end();
};

const testAppleFalling = async function (t) {
    await testFruitFalling(t, isApple, 'Apple', -5, false);
    t.end();
};

const testAppleFallingDetails = async function (t) {
    await testFruitFalling(t, isApple, 'Apple', -5, true);
    t.end();
};

const testBananaFalling = async function (t) {
    await testFruitFalling(t, isBanana, 'Banana', -7, false);
    t.end();
};

const testBananaFallingDetails = async function (t) {
    await testFruitFalling(t, isBanana, 'Banana', -7, true);
    t.end();
};

// -------------------- Fruit Spawn --------------------------------------

const testFruitSpawn = async function (t, isFruit, fruitName, testDetails = false) {
    t.seedScratch('seed');

    let {bowl, apple} = getSpritesAndVariables(t, ['bowl', 'apple']);

    /* Clear out new sprites. */
    t.getNewSprites();

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Catch apples with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    let oldFruits = t.getSprites(sprite => sprite.visible && isFruit(sprite) && sprite.y > 100);
    const fruitSpawnPositions = [];

    /* Detect fruit spawns by checking if any new fruit appears on the top of the screen each step.
     * Save the spawn position for detected fruits. */
    t.addCallback(() => {
        let fruits = t.getSprites(sprite => isFruit(sprite) && sprite.visible && sprite.y > 100);

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

    if (testDetails) {
        t.assume.greaterOrEqual(fruitSpawnPositions.length, 3,
            'At least three ', fruitName, 's must have spawned after 30 seconds.');
    } else {
        t.assert.greaterOrEqual(fruitSpawnPositions.length, 3,
            'At least three ', fruitName, 's must have spawned after 30 seconds.');
    }

    t.end();

    /* Ignore the first spawn position because it might be caused by an uninitialized sprite falling down. */
    fruitSpawnPositions.shift();
    return fruitSpawnPositions;
};

const testAppleSpawn = async function (t) {
    await testFruitSpawn(t, isApple, 'Apple', false);
    t.end();
};

const testAppleSpawnRandomXPosition = async function (t) {
    const appleSpawnPositions = await testFruitSpawn(t, isApple, 'Apple', true);

    const firstAppleX = appleSpawnPositions[0].x;
    let positionsDiffer = false;

    for (const pos of appleSpawnPositions) {
        if (pos.x !== firstAppleX) {
            positionsDiffer = true;
        }
    }

    t.assert.ok(positionsDiffer, 'Apples must spawn at random x positions.');
    t.end();
};

const testAppleSpawnYPosition = async function (t) {
    const appleSpawnPositions = await testFruitSpawn(t, isApple, 'Apple', true);
    for (const fruitPos of appleSpawnPositions) {
        t.assert.ok(fruitPos.y === 170 || fruitPos.y === 165, 'Apples must spawn at y = 170.');
    }
    t.end();
};

const testBananaSpawn = async function (t) {
    await testFruitSpawn(t, isBanana, 'Banana', false);
    t.end();
};

const testBananaSpawnRandomXPosition = async function (t) {
    const bananaSpawnPositions = await testFruitSpawn(t, isBanana, 'Banana', true);

    const firstBananaX = bananaSpawnPositions[0].x;
    let positionsDiffer = false;

    for (const pos of bananaSpawnPositions) {
        if (pos.x !== firstBananaX) {
            positionsDiffer = true;
        }
    }

    t.assert.ok(positionsDiffer, 'Bananas must spawn at random x positions.');
    t.end();
};

const testBananaSpawnYPosition = async function (t) {
    const bananaSpawnPositions = await testFruitSpawn(t, isBanana, 'Banana', true);
    for (const fruitPos of bananaSpawnPositions) {
        t.assert.ok(fruitPos.y === 170 || fruitPos.y === 163, `Bananas must spawn at y = 170.`);
    }
    t.end();
};

const testOnlyOneFruit = async function (t, isFruit, fruitName) {
    t.seedScratch('seed');

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Check that only one fruit of the type is visible at a time.
     * Or if two fruits are visible, check that they have the exact same position. */
    t.addConstraint(() => {
        const fruits = t.getSprites(s => s.visible && isFruit(s));

        if (fruits.length > 2) {
            const fruitPos = fruits[0].pos;
            for (let i = 1; i < fruits.length; i++) {
                const fruit = fruits[i];
                t.assert.ok(fruit.x === fruitPos.x && fruit.y === fruitPos.y,
                    'There can only be one ', fruitName, ' on the screen at a time.');
            }
        }
    });

    await testFruitSpawn(t, isFruit, fruitName, true);

    t.end();
};

const testOnlyOneApple = async function (t) {
    await testOnlyOneFruit(t, isApple, 'Apple');
    t.end();
};

const testOnlyOneBanana = async function (t) {
    await testOnlyOneFruit(t, isBanana, 'Banana');
    t.end();
};

const testBananaFallDelay = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple, banana} = getSpritesAndVariables(t, ['bowl', 'apple', 'banana']);

    /* Clear out new sprites. */
    t.getNewSprites();

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Catch apples with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    /* Check that the banana is invisible for the first second.
     * Only run for (combined) 500 ms because timings can be inconsistent. */
    const visibleConstraint = t.addConstraint(() => {
        for (const cloneOrSelf of banana.getClones(true)) {
            t.assert.ok(!cloneOrSelf.visible, 'Banana must not be visible for a second in the beginning.');
        }
    });
    await t.runForTime(500);
    visibleConstraint.disable();

    /* Check that the banana falls afterwards. */
    const bananaFalling = () => {
        for (const cloneOrSelf of banana.getClones(true)) {
            if (cloneOrSelf.visible && cloneOrSelf.y < cloneOrSelf.old.y) {
                return true;
            }
        }
        return false;
    };
    await t.runUntil(bananaFalling, 1000);
    t.assert.ok(bananaFalling(), 'Banana must fall after a second has passed.');

    t.end();
};

const testBananaGroundDelay = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple, banana} = getSpritesAndVariables(t, ['bowl', 'apple', 'banana']);

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Catch apples with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    /* Detect when a banana touches the ground. */
    let bananaTouched = false;
    let touchingBanana;
    t.onSpriteMoved(sprite => {
        if (!bananaTouched && isBanana(sprite)) {
            bananaTouched = spriteTouchingGround(sprite, bowl);
            if (bananaTouched === 'ground') {
                touchingBanana = sprite;
                t.cancelRun();
            } else {
                bananaTouched = false;
            }
        }
    });

    /* Run until the banana touches the ground. */
    await t.runForTime(30000);
    t.assume.equal(bananaTouched, 'ground', 'Banana didn\'t touch the ground in 30 seconds.');

    /* Run until the banana becomes invisible. */
    await t.runUntil(() => !touchingBanana.visible, 1500);

    /* Check that the banana is invisible for a second after touching the ground.
     * Only run for (combined) 500 ms because timings can be inconsistent. */
    const constraint = t.addConstraint(() => {
        for (const cloneOrSelf of banana.getClones(true)) {
            t.assert.ok(!cloneOrSelf.visible, 'Banana must not be visible for a second after touching the ground.');
        }
    });
    await t.runForTime(500);
    constraint.disable();

    /* Check that a banana falls again afterwards. */
    const bananaFalling = () => {
        for (const cloneOrSelf of banana.getClones(true)) {
            if (cloneOrSelf.visible && cloneOrSelf.y < cloneOrSelf.old.y) {
                return true;
            }
        }
        return false;
    };
    await t.runUntil(bananaFalling, 1000);
    t.assert.ok(bananaFalling(), 'Banana must fall after a second has passed.');

    t.end();
};

// -------------------- Fruit Interaction ---------------------------------

const testApplePoints = async function (t) {
    t.seedScratch('seed');

    const {bowl, score} = getSpritesAndVariables(t, ['bowl', 'score']);

    let appleTouched = false;
    let bananaTouched = false;

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Wait until an apple appears in the top of the screen. */
    let apple = await waitForSpriteOnTop(t, isApple, 5000);
    t.assume.ok(apple !== null, 'An apple must appear on the top of the screen after 5 seconds.');

    /* Catch apples with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    /* Cancel the run when the apple touches the bowl or the red line and save the score before the apple touched it.
     * Can't be done with addCallback() because the sprite can touch the bowl and be reset in the same step. */
    let scoreBefore = score.value;
    t.onSpriteMoved(sprite => {
        if (!appleTouched && isApple(sprite)) {
            appleTouched = spriteTouchingGround(sprite, bowl);
            if (appleTouched) {
                scoreBefore = Number(score.old.value);
                t.cancelRun();
            }
        } else if (!bananaTouched && isBanana(sprite)) {
            bananaTouched = spriteTouchingGround(sprite, bowl);
        }
    });

    /* Run until the apple touches the bowl. */
    bananaTouched = false;
    await t.runForTime(10000);
    if (bananaTouched) {
        t.log(`Banana touched the ${bananaTouched} before the apple touched the bowl.`);
    }

    t.assume.equal(appleTouched, 'bowl', 'Apple must have touched the bowl after five seconds.');
    t.onSpriteMoved(null);

    /* Give the program some time to add the score. */
    bananaTouched = false;
    await t.runUntil(() => score.value !== score.old.value, 1500);
    /* Skip the test if the apple touched the bowl or the ground before the score could be added. */
    t.assume.ok(!bananaTouched, 'Banana touched the ', bananaTouched, ' before apple\'s score could be added.');
    t.assert.equal(score.value, scoreBefore + 5, 'Apple must give 5 points when it touches the bowl.');

    /* Check the score twice, because the apple might stay there and continue giving points.
     * But skip the check if the banana touches the bowl or the ground in the meantime. */
    bananaTouched = false;
    await t.runUntil(() => score.value !== score.old.value, 1500);
    if (bananaTouched) {
        t.log(`Skipping assertion because banana touched the ${bananaTouched} after the apple touched the bowl.`);
    } else {
        t.assert.equal(score.value, scoreBefore + 5, 'Apple must only give points once when it touches the bowl.');
    }

    t.end();
};

const testAppleGameOver = async function (t, checkMessage = false) {
    t.seedScratch('seed');

    const {bowl} = getSpritesAndVariables(t, ['bowl']);

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

    if (checkMessage) {
        /* Only run for 500 ms because timings can be inconsistent. */
        await t.runUntil(() => apple.sayText, 500);

        t.assert.ok(apple.sayText, 'Apple must display a message if it hits the ground.');
        t.assert.matches(apple.sayText.toLowerCase(), gameOverRegex,
            'Apple must display \'Game over!\' when an it hits the ground.');

        await t.runForTime(500);
        t.assert.ok(apple.sayText, 'Apple must display a message for one second if it hits the ground.');

        await t.runUntil(() => !apple.sayText, 1000);
        t.assert.ok(!apple.sayText, 'Apple\'s game over message must disappear one second after it hit the ground');

    } else {
        /* Give the program some time to stop. */
        await t.runForTime(2000);

        playCallback.disable();
        t.resetKeyboard();
        await assertGameOver(t);
    }

    t.end();
};

const testAppleGameOverMessage = async function (t) {
    await testAppleGameOver(t, true);
    t.end();
};

const testBananaBowlPoints = async function (t) {
    t.seedScratch('seed');

    let {bowl, score, apple, banana} = getSpritesAndVariables(t, ['bowl', 'score', 'apple', 'banana']);

    let appleTouched = false;
    let bananaTouched = false;

    /* Catch the apple with the bowl.
     * Always use the newest banana clone. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        banana = getNewestClone(banana);
        followSprite(t, bowl.x, apple.x);
    });

    /* Cancel the run when the banana touches the bowl or the red line and save the score before the banana touched it.
     * Can't be done with addCallback() because the sprite can touch the bowl and reset in the same step. */
    let scoreBefore = score.value;
    t.onSpriteMoved(sprite => {
        if (!appleTouched && isApple(sprite)) {
            appleTouched = spriteTouchingGround(sprite, bowl);
            /* Skip the test if an apple touches the ground. */
            t.assume.ok(appleTouched !== 'ground', 'Apple must not touch the ground during this test.');
        } else if (bananaTouched !== 'bowl' && isBanana(sprite)) {
            bananaTouched = spriteTouchingGround(sprite, bowl);
            if (bananaTouched === 'bowl') {
                scoreBefore = Number(score.old.value);
                t.cancelRun();
            }
        }
    });

    /* Run and hope that the banana randomly touches the bowl. */
    appleTouched = false;
    await t.runForTime(30000);
    t.assume.equal(bananaTouched, 'bowl', 'Banana didn\'t touch the bowl after 30 seconds.');
    if (appleTouched) {
        t.log(`Apple touched the ${appleTouched} before the banana touched the bowl.`);
    }

    /* Give the program some time to add the score. */
    appleTouched = false;
    await t.runUntil(() => score.value !== score.old.value, 1500);
    t.assume.ok(!appleTouched, 'Apple touched the ', appleTouched, ' before banana\'s score could be added.');
    t.assert.equal(score.value, scoreBefore + 8, 'Banana must give 8 points when it touches the bowl.');

    /* Check the score twice, because the banana might stay there and continue giving points.
     * But skip the check if the apple touches the bowl or the ground in the meantime. */
    appleTouched = false;
    await t.runUntil(() => score.value !== score.old.value, 1500);
    if (appleTouched) {
        t.log(`Skipping assertion because apple touched the ${appleTouched} after the banana touched the bowl.`);
    } else {
        t.assert.equal(score.value, scoreBefore + 8, 'Banana must only give points once when it touches the bowl.');
    }

    t.end();
};

const testBananaGroundPoints = async function (t, checkMessage = false) {
    t.seedScratch('seed');

    let {bowl, score, apple, banana} = getSpritesAndVariables(t, ['bowl', 'score', 'apple', 'banana']);

    let appleTouched = false;
    let bananaTouched = false;

    /* Always use the newest banana clone. */
    t.addCallback(() => {
        banana = getNewestClone(banana);
    });

    /* Catch the apple with the bowl. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    /* Cancel the run when the banana touches the bowl or the red line and save the score before the banana touched it.
     * Can't be done with t.addCallback() because the sprite can touch the bowl and reset in the same step. */
    let scoreBefore = score.value;
    t.onSpriteMoved(sprite => {
        if (!appleTouched && isApple(sprite)) {
            appleTouched = spriteTouchingGround(sprite, bowl);
            /* Skip the test if an apple touches the ground. */
            t.assume.ok(appleTouched !== 'ground', 'Apple must not touch the ground during this test.');
        } else if (bananaTouched !== 'ground' && isBanana(sprite)) {
            bananaTouched = spriteTouchingGround(sprite, bowl);
            if (bananaTouched === 'ground') {
                scoreBefore = Number(score.old.value);
                t.cancelRun();
            }
        }
    });

    appleTouched = false;
    await t.runForTime(30000);
    t.assume.equal(bananaTouched, 'ground', 'Banana didn\'t touch the ground after 30 seconds.');
    if (appleTouched) {
        t.log(`Apple touched the ${appleTouched} before the banana touched the ground.`);
    }

    if (checkMessage) {
        /* Give the program some time to display the message. */
        await t.runUntil(() => banana.sayText, 500);

        t.assert.ok(banana.sayText, 'Banana must display a message when it hits the ground.');
        t.assert.matches(banana.sayText, /-\s?8/, 'Banana must display \'-8\' when it hits the ground.');

        await t.runForTime(500);
        t.assert.ok(banana.sayText, 'Banana must display a message for one second when it hits the ground');

        await t.runUntil(() => !banana.sayText, 1000);
        t.assert.ok(!banana.sayText, 'Banana\'s message must disappear a second after it hit the ground');

    } else {
        /* Give the program some time to add the score. */
        appleTouched = false;
        await t.runUntil(() => score.value !== score.old.value, 1500);
        /* Skip the test if a apple touched the bowl or the ground before the score could be added. */
        t.assume.ok(!appleTouched, 'Apple touched the ', appleTouched, ' before banana\'s score could be subtracted.');
        t.assert.equal(score.value, scoreBefore - 8, 'Banana must subtract 8 points when it touches the ground.');

        /* Check the score twice, because the banana might stay there and continue subtracting points.
         * But skip the check if the apple touches the bowl or the ground in the meantime. */
        appleTouched = false;
        await t.runUntil(() => score.value !== score.old.value, 1500);
        if (appleTouched) {
            t.log(`Skipping assertion because apple touched the ${appleTouched} after the banana touched the ground.`);
        } else {
            t.assert.equal(score.value, scoreBefore - 8,
                'Banana must only give points once when it touches the ground.');
        }
    }

    t.end();
};

const testBananaGroundMessage = async function (t) {
    await testBananaGroundPoints(t, true);
    t.end();
};

// -------------------- Timer --------------------------------------------------

const testTimerTick = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple, time} = getSpritesAndVariables(t, ['bowl', 'apple', 'time']);

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    t.addConstraint(() => t.assert.lessOrEqual(time.value, time.old.value, 'Time must not tick up.'));

    /* Play the game, so the timer can tick long enough. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    const timeBefore = t.getTotalTimeElapsed();
    let timeValue = time.value;

    /* Check 5 ticks of the time.
     * Give the program a bit more time every tick, because timings can be inconsistent. */
    for (let i = 0; i < 5; i++) {
        await t.runUntil(() => time.value == timeValue - 1, 1500);
        t.assert.equal(time.value, timeValue - 1, 'Time must decrease by one every second.');
        timeValue--;
    }

    /* Check if the speed of the timer is about one second per tick (>= 500ms and <= 1500ms). */
    const timeAfter = t.getTotalTimeElapsed();
    t.assert.ok(timeBefore + 7500 >= timeAfter, 'Time must not tick too slow.');
    t.assert.ok(timeBefore + 2500 <= timeAfter, 'Time must not tick too fast.');

    t.end();
};

const testTimerGameOver = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple, time} = getSpritesAndVariables(t, ['bowl', 'apple', 'time']);

    /* Give the program some time to initialize. */
    await t.runForTime(250);

    /* Play the game, so the timer can tick long enough. */
    const playCallback = t.addCallback(() => {
        apple = getNewestClone(apple);
        followSprite(t, bowl.x, apple.x);
    });

    /* Run the game for 20 seconds and check that it does not game over during that time. */
    for (let i = 0; i < 4; i++) {
        const gameOver = await runForTimeAndCheckIfGameOver(t, 5000);
        t.assert.ok(!gameOver, 'Game must not be over after ', 5 * (i + 1), ' seconds.');
    }

    await t.runUntil(() => time.value == 0, 20000);

    /* Give the game some time to go game over. */
    await t.runForTime(3000);

    playCallback.disable();
    t.resetKeyboard();
    await assertGameOver(t);

    t.end();
};

const testTimerGameOverMessage = async function (t) {
    t.seedScratch('seed');

    let {bowl, apple} = getSpritesAndVariables(t, ['bowl', 'apple']);

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
    t.assert.ok(!bowl.sayText, 'Bowl\'s game over message must disappear after one second');

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
    { // 02
        test: testBowlInitialization,
        name: 'Bowl Initialization Test',
        description: 'Tests the initialization of the bowl position. The bowl must start at (0, -145).',
        categories: ['initialization', 'bowl']
    },
    { // 03
        test: testFruitInitialization,
        name: 'Fruit Initialization Test',
        description: 'Tests the initialization of the size of apples and bananas. Apples and bananas must both have a size of 50%.',
        categories: ['initialization', 'apple', 'banana']
    },


    { // 04
        test: testMoveBowl,
        name: 'Bowl Movement Test',
        description: 'Tests the movement of the bowl sprite. The bowl must move in the respective direction when the left or right arrow key is pressed, and must not move if no arrow key is pressed.',
        categories: ['bowl movement', 'bowl', 'input']
    },
    { // 05
        test: testMoveBowlDetails,
        name: 'Bowl Movement Details Test',
        description: 'Tests the movement details of the bowl sprite. The bowl must move in steps of size 10 and never move vertically.',
        categories: ['bowl movement', 'bowl', 'input', 'constraints']
    },


    { // 06
        test: testAppleFalling,
        name: 'Apple Falling Test',
        description: 'Tests if the apple falls down from the top of the screen.',
        categories: ['fruit falling', 'apple']
    },
    { // 07
        test: testAppleFallingDetails,
        name: 'Apple Falling Details Test',
        description: 'Tests details of the apple falling down. The apple must fall in steps of -5 and must not move up or move horizontally.',
        categories: ['fruit falling', 'apple', 'constraints']
    },
    { // 08
        test: testBananaFalling,
        name: 'Banana Falling Test',
        description: 'Tests if the banana falls down from the top of the screen.',
        categories: ['fruit falling', 'banana']
    },
    { // 09
       test: testBananaFallingDetails,
        name: 'Banana Falling Details Test',
        description: 'Tests details of the banana falling down. The banana must fall in steps of -7 and must not move up or move horizontally.',
        categories: ['fruit falling', 'banana', 'constraints']
    },


    { // 10
        test: testAppleSpawn,
        name: 'Apple Spawn Test',
        description: 'Tests if apples spawn again after falling down.',
        categories: ['fruit spawn', 'apple', 'input']
    },
    { // 11
        test: testAppleSpawnRandomXPosition,
        name: 'Apple Spawn Random X Position Test',
        description: 'Tests if apples spawn at the correct x positions. Apples must spawn at random x positions.',
        categories: ['fruit spawn', 'apple', 'input']
    },
    { // 12
        test: testAppleSpawnYPosition,
        name: 'Apple Spawn Y Position Test',
        description: 'Tests if apples spawn at the correct y position. Apples must spawn at y = 170.',
        categories: ['fruit spawn', 'apple', 'input']
    },
    { // 13
        test: testBananaSpawn,
        name: 'Banana Spawn Test',
        description: 'Tests if bananas spawn after falling down.',
        categories: ['fruit spawn', 'banana', 'input']
    },
    { // 14
        test: testBananaSpawnRandomXPosition,
        name: 'Banana Spawn Random X Position Test',
        description: 'Tests if bananas spawn at the correct x positions. Bananas must spawn at random x positions.',
        categories: ['fruit spawn', 'banana', 'input']
    },
    { // 15
        test: testBananaSpawnYPosition,
        name: 'Banana Spawn Y Position Test',
        description: 'Tests if bananas spawn at the correct y position. Bananas must spawn at y = 170.',
        categories: ['fruit spawn', 'banana', 'input']
    },
    { // 16
        test: testOnlyOneApple,
        name: 'Only One Apple Test',
        description: 'Tests if there is only one apple visible during the game. There can also be two apples visible if they share the exact same position.',
        categories: ['fruit spawn', 'apple', 'constraints', 'input', 'slow']
    },
    { // 17
        test: testOnlyOneBanana,
        name: 'Only One Banana Test',
        description: 'Tests if there is only one banana visible during the game. There can also be two bananas visible if they share the exact same position.',
        categories: ['fruit spawn', 'banana', 'constraints', 'input', 'slow']
    },
    { // 18
        test: testBananaFallDelay,
        name: 'Banana Fall Delay Test',
        description: 'Tests if the banana waits a second in the beginning, before it falls down.',
        categories: ['fruit spawn', 'banana', 'input']
    },
    { // 19
        test: testBananaGroundDelay,
        name: 'Banana Ground Delay Test',
        description: 'Tests if the banana waits a second after it touches the ground, before it falls down.',
        categories: ['fruit spawn', 'banana', 'input', 'slow']
    },


    { // 20
        test: testApplePoints,
        name: 'Apple Points Test',
        description: 'Tests if apples give 5 points when they touch the bowl.',
        categories: ['fruit interaction', 'apple', 'score', 'input']
    },
    { // 21
        test: testAppleGameOver,
        name: 'Apple Game Over Test',
        description: 'Tests if an apples falling to the ground end the game.',
        categories: ['fruit interaction', 'apple', 'input']
    },
    { // 22
        test: testAppleGameOverMessage,
        name: 'Apple Game Over Message Test',
        description: 'Tests if an apples falling to the ground display a game over message.',
        categories: ['fruit interaction', 'apple', 'input']
    },
    { // 23
        test: testBananaBowlPoints,
        name: 'Banana Bowl Points Test',
        description: 'Tests if bananas give 8 points when they touch the bowl.',
        categories: ['fruit interaction', 'banana', 'score', 'input', 'slow']
    },
    { // 24
        test: testBananaGroundPoints,
        name: 'Banana Ground Points Test',
        description: 'Tests if bananas subtract 8 points when they touch the ground.',
        categories: ['fruit interaction', 'banana', 'score', 'input']
    },
    { // 25
        test: testBananaGroundMessage,
        name: 'Banana Ground Message Test',
        description: 'Tests if bananas display a message when they touch the ground.',
        categories: ['fruit interaction', 'banana', 'input']
    },


    { // 26
        test: testTimerTick,
        name: 'Timer Tick Test',
        description: 'Tests if the timer ticks down as expected. The timer must tick down by one every second.',
        categories: ['timer', 'time', 'input', 'slow', 'constraints']
    },
    { // 27
        test: testTimerGameOver,
        name: 'Timer Game Over Test',
        description: 'Tests if the game stops after the time limit is reached. The timer must start at 30 and end the game when it reaches 0.',
        categories: ['timer', 'time', 'input', 'slow', 'constraints']
    },
    { // 28
        test: testTimerGameOverMessage,
        name: 'Timer Game Over Message Test',
        description: 'Tests if the game displays a game over message after the time limit is reached.',
        categories: ['timer', 'time', 'input', 'slow']
    }
];
