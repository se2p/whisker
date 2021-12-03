## How to use

### Initialization and Test Driver Object Retrieval

```javascript
const {WhiskerUtil} = require('whisker');

const whisker = new WhiskerUtil(scratchVM, scratchProject);
whisker.prepare();
const t = whisker.getTestDriver();

whisker.start();

/* Run the Scratch VM and control it with t. */
...

whisker.end();
```

### Coverage Measurement

```javascript
const Thread = require('scratch-vm/src/engine/thread');
const {CoverageGenerator} = require('whisker');

CoverageGenerator.prepareThread(Thread);

/* After the project has been loaded. */
CoverageGenerator.prepare(scratchVm);

/* Run the Scratch program. (Can be run and reloaded multiple times.) */
...

const coverage = CoverageGenerator.getCoverage();

CoverageGenerator.restoreThread(Thread);
```

### Test Runner (t)

```javascript
/* Assertions. */
t.assert.ok(condition, message);
t.assert.not(condition, message);
t.assert.fail(message);
t.assert.equal(actual, expected, message);
t.assert.strictEqual(actual, expected, message);
t.assert.greater(actual, expected, message);
t.assert.greaterOrEqual(actual, expected, message);
t.assert.less(actual, expected, message);
t.assert.lessOrEqual(actual, expected, message);
t.assert.matches(actual, expected, message);

/* Assumptions. */
t.assume.ok(condition, message);
t.assume.not(condition, message);
t.assume.fail(message);
t.assume.equal(actual, expected, message);
t.assume.strictEqual(actual, expected, message);
t.assume.greater(actual, expected, message);
t.assume.greaterOrEqual(actual, expected, message);
t.assume.less(actual, expected, message);
t.assume.lessOrEqual(actual, expected, message);
t.assume.matches(actual, expected, message);
```

### Test Driver Object (t)

```javascript
/* Key Options */
space, enter, up arrow, right arrow, down arrow, left arrow

/* Events. */
t.greenFlag();
t.end();
t.clickStage();
t.clickSprite(spriteName, steps?);
t.clickClone(clone, steps?);
t.clickCloneByCoords(x, y, steps?);
t.dragSprite(spriteName, x, y);
t.keyPress(key, steps?);
t.keyRelease(key, steps?);
t.mouseDown(boolean);
t.mouseMove(x, y, steps);
t.typeText(answer);
t.sendSound(volume, steps?);

/* Sprite information. */
t.getSprites(condition, skipStage?);
t.getSpritesAtPoint(x, y);
t.getSpriteAtPoint(x, y);
t.getSprite(spriteName);
t.getStage();
t.getNewSprites(condition);
t.getRotationStyle(spriteName);
t.getSpriteVariable(spriteName, variableName);
t.onSpriteMoved(callback);
t.onSpriteVisualChange(func);
t.onSayOrThink(func)
t.onVariableChange(func)

/* Set Sprite Properties */
t.setVisibility(spriteName, visibility);
t.setSpriteVariable(spriteName, variableName, value);

/* Other Information. */
t.getStageSize();
t.getMousePos();
t.isMouseDown();
t.isKeyDown(key);
t.getGlobalVariable(variableName);
t.getAnswer();
t.isQuestionAsked();
// Returns the the acceleration factor, for example \texttt{10} at 300 Hz as the execution is accelerated by a
// factor of 10 compared to the default 30 Hz frequency
t.getAccelerationFactor(); // returns the accel
// Takes a string which gets logged into the log and output field
t.log(message);

/* Set Global Properties */
t.setGlobalVariable(variableName, value);
```

### Sprite Object (s)

```javascript
/* Attributes */
s.exists;                  s.pos;
s.old;                     s.direction;
s.isOriginal;              s.visible;
s.isStage;                 s.size;
s.name;                    s.currentCostume;
s.id;                      s.volume;
s.effects;                 s.layerOrder;
s.x;                       s.sayText;
s.y;                       s.sayText;
s.bounds;

/* Get Attributes */
s.getVariables(condition, skipStage?);
s.getVariable(variableName, skipStage?);
s.getLists(skipStage?);
s.getList(listName, skipStage?);
s.getInstances();
s.getOriginal();
s.getClones(withSelf?);
s.getClone(index);
s.getCloneCount(withSelf?);
s.getNewClones();
s.getCostumes();
s.getCostumeByIndex(index);
s.getCostumeByName(costumeName);
s.getCostumeCount();

/* Check Sprite Touching */
s.isPointinBounds(x, y);
s.isIntersectingBounds(otherBounds);
s.isTouchingMouse();
s.isTouchingMouse();
s.isTouchingSprite(spriteName);
s.isTouchingColor([r,g,b]);
s.isColorTouchingColor(targetRgb, maskRgb);
```

### Costume Object (c)

```javascript
/* Attributes */
c.skinId;
c.name;
c.bitmapResolution;
c.rotationCenterX;
c.rotationCenterY;
```

### Variable Object (v)

```javascript
/* Attributes */
v.name;
v.value;
v.old;
v.sprite;
v.getScratchVariable();
```

### Advanced Test Driver Object Functions (t)

```javascript
/* Running the program. */
await t.run(condition, timeout, steps);
await t.runForTime(time);
await t.runUntil(condition, timeout);
await t.runUntilChanges(func);
await t.runForSteps(steps, timeout);
t.cancelRun();

/* Run information. */
t.getTotalTimeElapsed();
t.getRunTimeElapsed();
t.getTotalStepsExecuted();
t.getRunStepsExecuted();
t.isProjectRunning();

// Seed tests to replicate results.
t.seedScratch(seed);
// returns { covered, total } representing covered and total blocks
t.getCoverage();
t.isCoverageEnabled();
// returns the amount of time passed since the start of the test-suite, independent of the test acceleration
t.getTotalRealTimeElapsed();
// returns the amount of time passed since the start of last run, independent of the test acceleration
t.getRealRunTimeElapsed();

/* Inputs. */
t.addInput(time, ioData);
t.addInputs(inputs);
t.reAddInput(time, input);
t.inputImmediate(ioData);
t.removeInput(input);
t.clearInputs();
t.resetMouse();
t.resetKeyboard();

/* Random inputs / Automated input generation. */
t.registerRandomInputs(inputs);
t.clearRandomInputs();
t.setRandomInputInterval(timeInterval);
t.detectRandomInputs(props);

/* Constraints. */
t.addConstraint(func, constraintName);
t.reAddConstraint(constraint);
t.removeConstraint(constraint);
t.clearConstraints();
t.onConstraintFailure(action);

/* Callbacks. */
t.addCallback(func);
t.reAddCallback(callback);
t.removeCallback(callback);
t.clearCallbacks();
```
