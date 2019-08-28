## Description

Block-based programming environments like Scratch foster engagement
with computer programming and are used by millions of young learners.
Scratch allows learners to quickly create entertaining programs and
games, while eliminating syntactical program errors that could
interfere with progress.

However, functional programming errors may still lead to incorrect
programs, and learners and their teachers need to identify and
understand these errors. This is currently an entirely manual process.

In our paper on 'Testing Scratch Programs Automatically' , we 
introduced a formal testing framework that describes
the problem of Scratch testing in detail. We instantiate this formal
framework with the Whisker tool, which provides automated and
property-based testing functionality for Scratch programs.

The implementation of Whisker can be found in this repository. 

![Whisker](https://raw.githubusercontent.com/se2p/whisker-main/master/logos/whisker-text-logo.jpg)

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
```

## Contributors

This project is developed at the Chair of Software Engineering II in Passau, Germany.

List of contributors:
- Gordon Fraser
- Marvin Kreis
- Andreas Stahlbauer

## Citing

```
@inproceedings{DBLP:conf/sigsoft/StahlbauerKF19,
  author    = {Andreas Stahlbauer and
               Marvin Kreis and
               Gordon Fraser},
  title     = {Testing scratch programs automatically},
  booktitle = {{ESEC/SIGSOFT} {FSE}},
  pages     = {165--175},
  publisher = {{ACM}},
  year      = {2019}
}
```
