const {Util} = require('whisker-main');
const EventEmitter = require('events');
const Recorder = require("whisker-main/src/vm/recorder");

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

    isRecording () {
        return this.startTime != null;
    }

    wait () {
        if (this.waitSteps > 0) {
            this.events.push(Recorder.wait(this.waitSteps));
            this.waitSteps = 0;
        }
    }

    step () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        this.waitSteps += steps;
    }

    greenFlag () {
        this.mouseMove();
        this.events.push(Recorder.greenFlag());
        this.step();
    }

    stop () {
        this.mouseMove();
        this.events.push(Recorder.end());
        this.step();
    }

    mouseMove () {
        if (this.mouseMoves.length > 0) {
            let end = this.mouseMoves[this.mouseMoves.length - 1];
            this.events.push(Recorder.mouseMove(end.x, end.y, this.waitSteps));
            this.mouseMoves = [];
            this.wait();
        }
        this.step();
    }

    onInput (data) {
        switch (data.device) {
            case 'mouse':
                this.onMouseInput(data);
                break;
            case 'keyboard':
                this.onKeyboardInput(data);
                break;
            case 'text':
                this.onTextInput(data);
                break;
            default:
                console.error(`Unknown input device: "${data.device}".`);
        }
    }

    onMouseInput (data) {
        if (data.isDown) {
            this.mouseMove();
            const target = Util.getTargetSprite(this.vm);
            this.events.push(Recorder.click(target, this.waitSteps));
            this.wait();
            this.step();
        } else {
            this.mouseMoves.push(data);
            this.step();
        }
    }

    onKeyboardInput (data) {
        if (data.isDown && data.key !== null) {
            this.mouseMove();
            const key = data.key;
            if (this.holdKey === null || this.holdKey !== key) {
                this.holdKey = key;
                const keyString = Util.getScratchKey(this.vm, key);
                this.events.push(Recorder.keyPress(keyString, this.waitSteps));
                this.wait();
            }
            this.step();
        }
    }

    onTextInput (data) {
        if (data.answer !== null) {
            this.mouseMove();
            this.events.push(Recorder.typeText(data.answer));
            this.wait();
            this.step();
        }
    }

    showInputs () {
        if (this.events != null && this.events.length !== 0) {
            Whisker.testEditor.setValue(this.testBegin + `\n${this.events.join('\n')}` + `\n}` + this.export);
        } else {
            Whisker.testEditor.setValue(this.testBegin + this.testEnd + this.export);
        }
        location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
        location.href = '#test-editor'
    }
}

module.exports = InputRecorder;
