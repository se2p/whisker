const {Util} = require('whisker-main');
const EventEmitter = require('events');

class InputRecorder extends EventEmitter {

    constructor (scratch) {
        super();

        this.scratch = scratch;
        this.vm = this.scratch.vm;

        this.events = null;
        this.startTime = null;

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
        this.startTime = Date.now();
        this.scratch.on('input', this._onInput);
    }

    stopRecording () {
        this.emit('stopRecording');
        this.scratch.removeListener('input', this._onInput);
        this.showInputs();
        this.events = null;
        this.startTime = null;
    }

    isRecording () {
        return this.startTime != null;
    }

    onInput (data) {
        const steps = Date.now() - this.startTime;
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
            const target = Util.getTargetSprite(this.vm);
            if (target.isStage) {
                event = Util.clickStage();
            } else if (target.isOriginal) {
                event = Util.clickSprite(target.getName(), steps);
            } else {
                event = Util.clickClone(target.x, target.y);
            }
        } else {
            // TODO: How to handle mouse movement?
            event = Util.mouseMove(data.x, data.y);
        }
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
        const event = Util.typeText(data.answer);
        this.events.push(event);
    }

    showInputs () {
        let inputCode = `${this.events.join('\n')}`;
        Whisker.testEditor.setValue(this.testBegin + inputCode + this.testEnd + this.export);
        location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
        location.href = '#test-editor'
    }
}

module.exports = InputRecorder;
