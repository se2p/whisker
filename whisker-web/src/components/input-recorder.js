const {Util} = require('whisker-main');
const EventEmitter = require('events');

class InputRecorder extends EventEmitter {

    constructor (scratch) {
        super();

        this.scratch = scratch;
        this.vm = this.scratch.vm;

        this.events = null;
        this.startTime = null;
        this.lastInputTime = null;
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
        this.lastInputTime = null;
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
        this.lastInputTime = null;
        this.waitTime = null;
        this.stepCount = null;
    }

    isRecording () {
        return this.startTime != null;
    }

    greenFlag () {
        let event = Util.greenFlag();
        this.events.push(event);
    }

    stop () {
        let event = Util.end();
        this.events.push(event);
    }

    onInput (data) {
        this.checkWaitTime();
        const steps = this.calculateSteps();
        switch (data.device) {
            case 'mouse':
                this.onMouseInput(steps, data);
                this.lastInputTime = Date.now();
                break;
            case 'keyboard':
                this.onKeyboardInput(steps, data);
                this.lastInputTime = Date.now();
                break;
            case 'text':
                this.onTextInput(data);
                this.lastInputTime = Date.now();
                break;
            default:
                console.error(`Unknown input device: "${data.device}".`);
        }
    }

    onMouseInput (steps, data) {
        if (data.isDown) {
            this._onMouseDown(steps);
        } else if (this.waitTime > 100) {
            this._onMouseMove(data);
        }
    }

    _onMouseDown (steps) {
        let event;
        const target = Util.getTargetSprite(this.vm);
        if (target.isStage) {
            event = Util.clickStage();
        } else if (target.isOriginal) {
            event = Util.clickSprite(target.getName(), steps);
        } else {
            event = Util.clickClone(target.x, target.y);
        }
        this.events.push(event);
    }

    _onMouseMove (data) {
        let event = Util.mouseMove(data.x, data.y);
        this.events.push(event);
    }

    onKeyboardInput (steps, data) {
        if (data.isDown) {
            const key = Util.getScratchKey(this.vm, data.key);
            const event = Util.keyPress(key, steps);
            this.events.push(event);
        }
    }

    onTextInput (data) {
        if (data.answer) {
            const event = Util.typeText(data.answer);
            this.events.push(event);
        }
    }

    calculateSteps () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        return steps > 0 ? steps : 1;
    }

    checkWaitTime () {
        if (this.lastInputTime != null) {
            this.waitTime = Date.now() - this.lastInputTime;
            this.events.push(Util.wait(this.waitTime));
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
