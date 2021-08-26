## How to use

### Initialization and getting the test driver object

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

### Coverage measurement

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

### Functions of the test driver object (t)

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
t.getTotalTimeElapsed();
t.getRunTimeElapsed();
t.getTotalStepsExecuted();
t.getRunStepsExecuted();
t.isProjectRunning();

// returns { covered, total } representing covered and total blocks
t.getCoverage();
// returns the amount of time passed since the start of the test-suite, independent of the test acceleration
t.getTotalRealTimeElapsed();
// returns the amount of time passed since the start of last run, independent of the test acceleration
t.getRealRunTimeElapsed();

/* Events. */
t.clickStage();
t.clickSprite(name, steps);
t.clickClone(x, y, steps);
t.dragSprite(name, x, y);
t.keyPress(keyOption, steps);
t.mouseDown(boolean);
t.mouseMove(x, y);
t.mouseMoveToEvent(x, y);
t.typeText(text);
t.wait(steps);

/* Sprite information. */
t.getSprites(condition, skipStage);
t.getSpritesAtPoint(x, y);
t.getSpriteAtPoint(x, y);
t.getSprite(name);
t.getStage();
t.getNewSprites(condition);
t.onSpriteMoved(callback);
t.onSpriteVisualChange(func);

/* Callbacks. */
t.addCallback(func);
t.reAddCallback(callback);
t.removeCallback(callback);
t.clearCallbacks();

/* Inputs. */
t.addInput(time, ioData);
t.reAddInput(time, input);
t.inputImmediate(ioData);
t.removeInput(input);
t.clearInputs();
t.resetMouse();
t.resetKeyboard();
t.getMousePos();
t.isMouseDown();
t.isKeyDown(key);

/* Random inputs / Automated input generation. */
t.registerRandomInputs(inputs);
t.clearRandomInputs();
t.setRandomInputInterval(timeInterval);
t.detectRandomInputs(props);

/* Constraints. */
t.addConstraint(func, name);
t.reAddConstraint(constraint);
t.removeConstraint(constraint);
t.clearConstraints();
t.onConstraintFailure(action);

/* Other. */
t.greenFlag();
t.getStageSize();
t.end();

// Takes a string which gets logged into the log and output field
t.log(message);

// Returns the the acceleration factor, for example \texttt{10} at 300 Hz as the execution is accelerated by a
// factor of 10 compared to the default 30 Hz frequency
t.getAccelerationFactor(); // returns the accel
```
