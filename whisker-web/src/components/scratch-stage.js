const EventEmitter = require('events');

const ScratchStorage = require('scratch-storage');
const ScratchRender = require('scratch-render');
const ScratchSVGRenderer = require('scratch-svg-renderer');
const AudioEngine = require('scratch-audio');
const VirtualMachine = require('scratch-vm');
const logger = require('../logger');

const ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu';
const PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu';

/**
 * <canvas></canvas>
 */
class Scratch extends EventEmitter {

    static INPUT_LISTENER_KEY = 'input';

    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.vm = Scratch.prepareVM(this.canvas);
        this.project = null;
        this.inputEnabled = false;
        this.keyPresses = [];

        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onQuestion = this.onQuestion.bind(this);
        this._registerKeyPress = this.registerKeyPress.bind(this);
    }

    async loadProject(project) {
        this.project = project;
        this.vm.clear();

        // Wait until a previous call to load the project finishes to avoid duplicate block ids.
        while (this.vm.isLoading){
            await new Promise(r => setTimeout(r, 1000));
        }
        await this.vm.loadProject(project);

        // Note: this _step() is necessary to update the canvas. Otherwise, it remains blank, or it still shows the
        // previously loaded project. The test runner will also re-load the project before execution, because it needs
        // to undo the effects of the _step() taken here.
        // TODO: check if this approach can be addressed with this.vm.renderer.draw(),
        //  also check why the loadProject() call doesn't already take care of this
        this.vm.runtime._step();
    }

    /**
     * Extract Block-Based Tests contained in the currently loaded Scratch project from the VM.
     *
     * @return {Map<string, Test>} A map that maps the hat block ID of a BBT to its data.
     */
    getBBTTestsOfCurrentProject() {
        const bbtTests = new Map();

        for (const target of this.vm.runtime.targets) {

            const bbtTestHatBlocks = Object.values(target.blocks._blocks)
                .filter(block => block.opcode === 'bbt_testHat');

            for (const bbtTestHatBlock of bbtTestHatBlocks) {

                // input block: where the test name can be entered
                const correspondingInputBlock = target.blocks._blocks[bbtTestHatBlock.inputs.testName.block];
                const correspondingComment = target.comments[bbtTestHatBlock.comment];

                if (!correspondingInputBlock) {
                    logger.error('BBT test hat block without input block?');
                    continue;
                }

                const testObject = {
                    id: bbtTestHatBlock.id,
                    type: 'BBT',
                    categories: ['BBT'],
                    skip: false,
                    name: correspondingInputBlock.fields.TEXT.value,
                    description: correspondingComment ? correspondingComment.text : '-',
                    containingSpriteId: target.id,
                    hatBlockId: bbtTestHatBlock.id
                };

                bbtTests.set(bbtTestHatBlock.id, testObject);

            }
        }

        return bbtTests;
    }

    async reset() {
        return await this.loadProject(this.project);
    }

    start() {
        this.vm.start();
    }

    greenFlag() {
        this.start();
        this.vm.greenFlag();
    }

    stop() {
        this.vm.stopAll();
        this.vm.runtime._step();
    }

    /**
     * @returns {boolean} .
     */
    isInputEnabled() {
        return this.inputEnabled;
    }

    enableInput() {
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('mouseup', this._onMouseUp);
        this.canvas.addEventListener('keydown', this._onKeyDown);
        this.canvas.addEventListener('keyup', this._onKeyUp);
        this.vm.runtime.on('QUESTION', this._onQuestion);
        this.inputEnabled = true;
    }

    disableInput() {
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('mouseup', this._onMouseUp);
        this.canvas.removeEventListener('keydown', this._onKeyDown);
        this.canvas.removeEventListener('keyup', this._onKeyUp);
        this.vm.runtime.removeListener('QUESTION', this._onQuestion);
        this.inputEnabled = false;
    }

    static prepareVM(canvas) {
        const storage = new ScratchStorage();
        const AssetType = storage.AssetType;
        storage.addWebStore([AssetType.Project], Scratch.getProjectUrl, Scratch.getProjectUrl,
            Scratch.getProjectUrl);
        storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], Scratch.getAssetUrl,
            Scratch.getAssetUrl, Scratch.getAssetUrl);

        const renderer = new ScratchRender(canvas);
        const audioEngine = new AudioEngine();
        const SVGAdapter = new ScratchSVGRenderer.SVGRenderer();
        const bitmapAdapter = new ScratchSVGRenderer.BitmapAdapter();

        const vm = new VirtualMachine();
        vm.attachRenderer(renderer);
        vm.attachAudioEngine(audioEngine);
        vm.attachStorage(storage);
        vm.attachV2SVGAdapter(SVGAdapter);
        vm.attachV2BitmapAdapter(bitmapAdapter);

        return vm;
    }

    static getProjectUrl(asset) {
        const assetIdParts = asset.assetId.split('.');
        const assetUrlParts = [PROJECT_SERVER, '/internalapi/project/', assetIdParts[0], '/get/'];
        if (assetIdParts[1]) {
            assetUrlParts.push(assetIdParts[1]);
        }
        return assetUrlParts.join('');
    }

    static getAssetUrl(asset) {
        const assetUrlParts = [
            ASSET_SERVER,
            '/internalapi/asset/',
            asset.assetId,
            '.',
            asset.dataFormat,
            '/get/'
        ];
        return assetUrlParts.join('');
    }

    onMouseMove(e) {
        e.preventDefault();
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        const data = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        this.vm.postIOData('mouse', data);
        this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'mouse', ...data});
    }

    onMouseDown(e) {
        e.preventDefault();
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        const data = {
            isDown: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        this.vm.postIOData('mouse', data);
        this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'mouse', ...data});
    }

    onMouseUp(e) {
        e.preventDefault();
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        const data = {
            isDown: false,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };
        this.vm.postIOData('mouse', data);
        this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'mouse', ...data});
    }

    onKeyDown(e) {
        e.preventDefault();
        const data = {
            keyCode: e.keyCode,
            key: e.key,
            isDown: true
        };
        this.vm.postIOData('keyboard', data);
        this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'keyboard', ...data});
    }

    onKeyUp(e) {
        e.preventDefault();
        const data = {
            key: e.key,
            isDown: false
        };
        this.vm.postIOData('keyboard', data);
        this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'keyboard', ...data});
    }

    onQuestion() {
        this.keyPresses = [];
        this.canvas.addEventListener('keydown', this._registerKeyPress);
    }

    registerKeyPress(e) {
        if (e.key === 'Backspace') {
            this.keyPresses.pop();
        } else if (e.key === 'Enter') {
            const textInput = this.keyPresses.join('');
            this.vm.runtime.emit('ANSWER', textInput);
            this.vm.runtime.emit('ANSWERED_PROGRAMMATICALLY');
            this.emit(Scratch.INPUT_LISTENER_KEY, {device: 'text', text: textInput});
            this.keyPresses = [];
            this.canvas.removeEventListener('keydown', this._registerKeyPress);
        } else {
            this.keyPresses.push(e.key);
        }
    }
}

module.exports = Scratch;
