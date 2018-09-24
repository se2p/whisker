const VirtualMachine = require('scratch-vm');
const ScratchStorage = require('scratch-storage');
const ScratchRender = require('scratch-render');
const ScratchSVGRenderer = require('scratch-svg-renderer');
const AudioEngine = require('scratch-audio');

const Whisker = {
    VirtualMachine: VirtualMachine,
    ScratchStorage: ScratchStorage,
    ScratchRender: ScratchRender,
    ScratchSVGRenderer: ScratchSVGRenderer,
    AudioEngine: AudioEngine
};

Whisker.loadFromString = function (src) {
    return eval(src);
};

module.exports = Whisker;
