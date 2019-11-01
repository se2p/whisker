const {Util} = require('../../../whisker-main');
const EventEmitter = require('events');

class InputRecorder extends EventEmitter {
    constructor (scratch) {
        super();

        this.scratch = scratch;

        this.inputs = null;
        this.startTime = null;

        this._onInput = this.onInput.bind(this);
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

    showInputs () {
        const inputs = this.inputs.map(input => `    ${JSON.stringify(input)}`);
        const inputCode = `t.addInputs([\n${inputs.join(',\n')}\n]);`;

        const $ = window.$;
        const modal = $(
            `<div class="modal" role="dialog">
                <div class="modal-dialog role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Code For Recorded Inputs</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <pre>${inputCode}</pre>
                        </div>
                    </div>
                </div>
            </div>`
        );

        modal.appendTo(document.body);
        modal.modal('show');
    }
}

module.exports = InputRecorder;
