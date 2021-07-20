const {Util} = require('whisker-main');
const EventEmitter = require('events');

class InputRecorder extends EventEmitter {

    constructor (scratch) {
        super();

        this.scratch = scratch;

        this.inputs = null;
        this.startTime = null;

        this._onInput = this.onInput.bind(this);

        this.testBegin = 'const test = async function (t) {\n';
        this.testEnd = '\n    await t.wait(5000);\n    t.end();\n}';
        this.export =  '\n\n\n' +
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
        this.inputs = [];
        this.startTime = Date.now();
        this.scratch.on('input', this._onInput);
    }

    stopRecording () {
        this.emit('stopRecording');
        this.scratch.removeListener('input', this._onInput);
        this.showInputs();
        this.inputs = null;
        this.startTime = null;
    }

    isRecording() {
        return this.startTime != null;
    }

    onInput (data) {
        switch (data.device) {
        case 'mouse':
            this.onMouseInput(data);
            break;
        case 'keyboard':
            this.onKeyboardInput(data);
            break;
        default:
            console.error(`Unknown input device: "${data.device}".`);
        }
    }

    onMouseInput (data) {
        const coords = Util.getScratchCoords(this.scratch.vm, data.x, data.y);

        const input = {
            device: 'mouse',
            x: coords.x.toFixed(2),
            y: coords.y.toFixed(2)
        };

        if ('isDown' in data) {
            input.isDown = data.isDown;
        } else {
            // TODO: How will mouse movement be handled?
            return;
        }

        this.recordInput(input);
    }

    onKeyboardInput (data) {
        const key = Util.getScratchKey(this.scratch.vm, data.key);

        const input = {
            device: 'keyboard',
            key,
            isDown: data.isDown
        };

        this.recordInput(input);
    }

    recordInput (input) {
        this.inputs.push({
            time: Date.now() - this.startTime,
            input
        });
    }

    // TODO Convert input to event functions
    showInputs () {
        const inputs = this.inputs.map(input => `        ${JSON.stringify(input)}`);
        let inputCode = `    t.addInputs([\n${inputs.join(',\n')}\n    ]);`;
        Whisker.testEditor.setValue(this.testBegin + inputCode + this.testEnd + this.export);
        location.href = "#"; // this line is required to work around a bug in WebKit (Chrome / Safari) according to stackoverflow
        location.href = '#test-editor'
    }
}

module.exports = InputRecorder;
