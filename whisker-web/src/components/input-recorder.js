const {Util} = require('whisker-main');
const EventEmitter = require('events');
const Recorder = require('whisker-main/src/vm/recorder');

/**
 * Enables to record user input for test recordings.
 */
class InputRecorder extends EventEmitter {
    constructor (scratch) {
        super();

        this.scratch = scratch;
        this.vm = this.scratch.vm;

        this.events = null;
        this.startTime = null;
        this.waitSteps = null;
        this.stepCount = null;
        this.mouseMoves = null;
        this.holdKey = null;

        this._onInput = this.onInput.bind(this);

        this.testBegin = 'const test = async function (t) {';
        this.testEnd = '\n    t.greenFlag();\n    await t.wait(5000);\n    t.end();\n}';
        this.export = '\n\n\n' +
            `module.exports = [
    {
        test: test,
        name: 'Recorded Test',
        description: '',
        categories: []
    }
];`;
    }

    /**
     * Sets the {@link InputRecorder} into its default setting for the test recording.
     */
    startRecording () {
        this.emit('startRecording');
        this.events = [];
        this.startTime = Date.now();
        this.waitSteps = 0;
        this.stepCount = 1;
        this.mouseMoves = [];
        this.scratch.on('input', this._onInput);
        this.holdKey = null;
    }

    /**
     * Resets the {@link InputRecorder} into its default setting after test recording.
     */
    stopRecording () {
        this.emit('stopRecording');
        this.scratch.removeListener('input', this._onInput);
        this.showInputs();
        this.events = null;
        this.startTime = null;
        this.waitSteps = 0;
        this.stepCount = 0;
        this.mouseMoves = null;
        this.holdKey = null;
    }

    /**
     * Evaluates if the {@link InputRecorder} is currently active.
     * @returns {boolean} true if the recorder is active, false otherwise.
     */
    isRecording () {
        return this.startTime !== null;
    }

    /**
     * Updates the step count of the {@link InputRecorder}.
     * @private
     */
    _step () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        this.waitSteps += steps;
    }

    /**
     * After checking for mouse movement, a green flag event is added to the recorded events.
     * The step count is also updated after the event was recorded.
     */
    greenFlag () {
        this._mouseMove();
        this.events.push(Recorder.greenFlag());
        this._step();
    }

    /**
     * After checking for mouse movement, an end event is added to the recorded events.
     * The step count is also updated after the event was recorded.
     */
    stop () {
        this._mouseMove();
        this.events.push(Recorder.end());
        this._step();
    }

    /**
     * Adds a wait event to the recorded events.
     * @private
     */
    _wait () {
        if (this.waitSteps > 0) {
            this.events.push(Recorder.wait(this.waitSteps));
            this.waitSteps = 0;
        }
    }

    /**
     * Adds a mouse move event to the recorded events.
     * The step count is also updated after the event was recorded.
     * @private
     */
    _mouseMove () {
        if (this.mouseMoves.length > 0) {
            const end = this.mouseMoves[this.mouseMoves.length - 1];
            this.events.push(Recorder.mouseMove(end.x, end.y, this.waitSteps));
            this.mouseMoves = [];
            this._wait();
        }
        this._step();
    }

    /**
     * Records input data of I/O devices and handles it accordingly.
     * @param {object} data The recorded input.
     */
    onInput (data) {
        switch (data.device) {
        case 'mouse':
            this._onMouseInput(data);
            break;
        case 'keyboard':
            this._onKeyboardInput(data);
            break;
        case 'text':
            this._onTextInput(data);
            break;
        default:
            console.error(`Unknown input device: "${data.device}".`);
            return;
        }
    }

    /**
     * Divides the input into mouse click and mouse movement events.
     * The wait event and step count are also updated afterwards.
     * @param {object} data The recorded input.
     * @private
     */
    _onMouseInput (data) {
        if (data.isDown) {
            this._mouseMove();
            const target = Util.getTargetSprite(this.vm);
            this.events.push(Recorder.click(target, this.waitSteps));
            this._wait();
            this._step();
        } else {
            this.mouseMoves.push(data);
            this._step();
        }
    }

    /**
     * After checking for mouse movement, stores the corresponding key press event.
     * The keyboard key event has to be converted into a scratch key.
     * The wait event and step count are also updated afterwards.
     * @param {object} data The recorded input.
     * @private
     */
    _onKeyboardInput (data) {
        if (data.isDown && data.key !== null) {
            this._mouseMove();
            const key = data.key;
            if (this.holdKey === null || this.holdKey !== key) {
                this.holdKey = key;
                const keyString = this.vm.runtime.ioDevices.keyboard._keyStringToScratchKey(key);
                this.events.push(Recorder.keyPress(keyString, this.waitSteps));
                this._wait();
            }
            this._step();
        }
    }

    /**
     * After checking for mouse movement, stores the corresponding type text event.
     * The wait event and step count are also updated afterwards.
     * @param {object} data The recorded input.
     * @private
     */
    _onTextInput (data) {
        if (data.answer !== null) {
            this._mouseMove();
            this.events.push(Recorder.typeText(data.answer));
            this._wait();
            this._step();
        }
    }

    /**
     * Displays the recorded test in the {@link TestEditor}.
     */
    showInputs () {
        if (this.events !== null && this.events.length !== 0) {
            Whisker.testEditor.setValue(`${this.testBegin}\n${this.events.join('\n')}\n}${this.export}`);
        } else {
            Whisker.testEditor.setValue(this.testBegin + this.testEnd + this.export);
        }
        // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
        location.href = '#';
        location.href = '#test-editor';
    }
}

module.exports = InputRecorder;
