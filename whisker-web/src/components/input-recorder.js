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
        this.inputTime = null;
        this.waitTime = null;
        this.stepCount = null;

        this._onInput = this.onInput.bind(this);

        this.testBegin = 'const test = async function (t) {';
        this.testEnd = '\n    t.greenFlag();\n    t.wait(5000);\n    t.end();\n}';
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
        this.inputTime = null;
        this.startTime = Date.now();
        this.waitTime = null;
        this.stepCount = null;
        this.scratch.on('input', this._onInput);
    }

    stopRecording () {
        this.emit('stopRecording');
        this.scratch.removeListener('input', this._onInput);
        this.showInputs();
        this.events = null;
        this.startTime = null;
        this.inputTime = null;
        this.waitTime = null;
        this.stepCount = null;
    }

    isRecording () {
        return this.startTime != null;
    }

    greenFlag () {
        this.updateWaitTime();
        this.inputTime = Date.now();
        this.events.push(Recorder.wait(this.waitTime));
        this.events.push(Recorder.greenFlag());
    }

    stop () {
        this.updateWaitTime();
        this.inputTime = Date.now();
        this.events.push(Recorder.wait(this.waitTime));
        this.events.push(Recorder.end());
    }

    onInput (data) {
        this.updateWaitTime();
        this.inputTime = Date.now();
        const steps = this.calculateSteps();
        switch (data.device) {
            case 'mouse':
                this.onMouseInput(steps, data);
                break;
            case 'keyboard':
                this.onKeyboardInput(steps, data);
                break;
            case 'text':
                this.onTextInput(data);
                break;
            default:
                console.error(`Unknown input device: "${data.device}".`);
        }
    }

    onMouseInput (steps, data) {
        if (data.isDown) {
            this.events.push(Recorder.wait(this.waitTime));
            const target = Util.getTargetSprite(this.vm);
            this.events.push(Recorder.click(target, steps));
        } else if (this.waitTime > 100) {
            this.events.push(Recorder.mouseMove(data.x, data.y));
        }
    }

    onKeyboardInput (steps, data) {
        if (data.isDown) {
            const key = Util.getScratchKey(this.vm, data.key);
            this.events.push(Recorder.wait(this.waitTime));
            this.events.push(Recorder.keyPress(key, steps));
        }
    }

    onTextInput (data) {
        if (data.answer) {
            this.events.push(Recorder.wait(this.waitTime));
            this.events.push(Recorder.typeText(data.answer));
        }
    }

    calculateSteps () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        return steps > 0 ? steps : 1;
    }

    updateWaitTime () {
        if (this.inputTime != null) {
            this.waitTime += Date.now() - this.inputTime;
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
