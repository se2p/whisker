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

    init () {
        this.mouseMove();
        this.wait();
        return this.step();
    }

    step () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        this.waitSteps += steps;
        return steps > 0 ? steps : 1;
    }

    wait () {
        if (this.waitSteps > 0) {
            this.events.push(Recorder.wait(this.waitSteps));
            this.waitSteps = 0;
        }
    }

    greenFlag () {
        this.init();
        this.events.push(Recorder.greenFlag());
    }

    stop () {
        this.init();
        this.events.push(Recorder.end());
    }

    mouseMove () {
        if (this.mouseMoves.length > 0) {
            let start = this.mouseMoves[0];
            let end = this.mouseMoves[this.mouseMoves.length - 1];
            this.events.push(Recorder.mouseMove(start.x, start.y));
            this.events.push(Recorder.mouseMove(end.x, end.y));
            this.mouseMoves = [];
        }
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
            const target = Util.getTargetSprite(this.vm);
            let steps = this.init();
            this.events.push(Recorder.click(target, steps));
        } else {
            this.mouseMoves.push(data);
        }
    }

    onKeyboardInput (data) {
        if (data.isDown) {
            if (this.holdKey === null || this.holdKey !== data.key) {
                this.holdKey = data.key;
                const key = Util.getScratchKey(this.vm, data.key);
                let steps = this.init();
                this.events.push(Recorder.keyPress(key, steps));
            }
        }
    }

    onTextInput (data) {
        if (data.answer) {
            this.init();
            this.events.push(Recorder.typeText(data.answer));
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
