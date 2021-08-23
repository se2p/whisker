const {Util} = require('whisker-main');
const EventEmitter = require('events');

class InputRecorder extends EventEmitter {

    constructor (scratch) {
        super();

        this.scratch = scratch;
        this.vm = this.scratch.vm;

        this.events = null;
        this.startTime = null;
        this.waitTime = null;
        this.stepCount = null;

        this._onInput = this.onInput.bind(this);

        this.testBegin = 'const test = async function (t) {\n';
        this.testEnd = '\n    t.wait(5000);\n    t.end();\n}';
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
        this.waitTime = null;
        this.startTime = Date.now();
        this.stepCount = null;
        this.scratch.on('input', this._onInput);
    }

    stopRecording () {
        this.emit('stopRecording');
        this.scratch.removeListener('input', this._onInput);
        this.showInputs();
        this.events = null;
        this.startTime = null;
        this.waitTime = null;
        this.stepCount = null;
    }

    isRecording () {
        return this.startTime != null;
    }

    onInput (data) {
        // TODO: GreenFlag, cancelRun
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
        let event;
        if (data.isDown) {
            this.checkWaitTime();
            const target = Util.getTargetSprite(this.vm);
            if (target.isStage) {
                event = Util.clickStage();
            } else if (target.isOriginal) {
                event = Util.clickSprite(target.getName(), steps);
            } else {
                event = Util.clickClone(target.x, target.y);
            }
            this.events.push(event);
        } else {
            // TODO: Mouse Movement
            this.waitTime += steps;
        }
    }

    onKeyboardInput (steps, data) {
        if (data.isDown) {
            this.checkWaitTime();
            const key = Util.getScratchKey(this.vm, data.key);
            const event = Util.keyPress(key, steps);
            this.events.push(event);
        }
    }

    onTextInput (data) {
        this.checkWaitTime();
        const event = Util.typeText(data.answer);
        this.events.push(event);
    }

    calculateSteps () {
        const steps = this.vm.runtime.stepsExecuted - this.stepCount;
        this.stepCount += steps;
        return steps > 0 ? steps : 1;
    }

    checkWaitTime () {
        if (this.waitTime != null) {
            this.events.push(Util.wait(this.waitTime));
            this.waitTime = null;
        }
    }

    showInputs () {
        let inputCode = `${this.events.join('\n')}`;
        Whisker.testEditor.setValue(this.testBegin + inputCode + this.testEnd + this.export);
        location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
        location.href = '#test-editor'
    }
}

module.exports = InputRecorder;
