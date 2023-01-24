const _coveredBlockIds = new Set();
const _blockIdsPerSprite = new Map();
const _blockDescriptions = new Map();
const cloneDeep = require('lodash.clonedeep');
const Util = require("../vm/util");


let threadPreparedForCoverage = false;

/* Only works with Scratch 3.0 (.sb3) projects. sb2 projects can be easily converted by saving them with Scratch 3.0. */
class Coverage {
    constructor (coveredBlockIdsPerSprite, blockIdsPerSprite, blockDescriptions) {

        /**
         * @type {Map<string, Set<string>>}
         */
        this.coveredBlockIdsPerSprite = coveredBlockIdsPerSprite;

        /**
         * @type {Map<string, Set<string>>}
         */
        this.blockIdsPerSprite = blockIdsPerSprite;


        /**
         * @type {Map<string, {sprite: string, opcode: string: id: string}}
         */
        this.blockDescriptions = blockDescriptions;
    }

    /**
     * @return {Map<string,Set<string>>} .
     */
    getCoveredBlockIdsPerSprite () {
        return new Map(this.coveredBlockIdsPerSprite);
    }

    /**
     * @return {Map<string,Set<string>>} .
     */
    getBlockIdsPerSprite () {
        return new Map(this.blockIdsPerSprite);
    }

    /**
     * @return {Map<string, {sprite: string, opcode: string: id: string}}
     */
    getBlockDescriptions () {
        return new Map(this.blockDescriptions);
    }

    /**
     * @return {Map<string, {covered: number, total: number}>} .
     */
    getCoveragePerSprite () {
        const coverage = {};

        for (const [spriteName, coveredBlockIds] of this.coveredBlockIdsPerSprite) {
            const numCovered = coveredBlockIds.size;
            const numTotal = this.blockIdsPerSprite.get(spriteName).size;
            coverage[spriteName] = {covered: numCovered, total: numTotal};
        }

        return coverage;
    }

    /**
     * @return {{covered: number, total: number}} .
     */
    getCoverageTotal () {
        let numCovered = 0;
        let numTotal = 0;

        for (const coveredBlockIds of this.coveredBlockIdsPerSprite.values()) {
            numCovered += coveredBlockIds.size;
        }
        for (const blockIds of this.blockIdsPerSprite.values()) {
            numTotal += blockIds.size;
        }

        return {covered: numCovered, total: numTotal};
    }
}

/**
 * Keeps a reference to all "main" blocks (i.e. blocks that don't represent a parameter), and checks which of these
 * blocks are executed by any prepared Thread. This means that the coverage can only be measured on one vm at a time.
 */
class CoverageGenerator {

    /**

     * @param classes
     * @param testRunner
     * @param {recordExecutionTrace: boolean} recordExecutionTrace
     */
    static prepareClasses (classes, testRunner, recordExecutionTrace=false) {
        const Thread = classes.Thread;

        if (!Thread.hasOwnProperty('real_pushStack')) {
            Thread.real_pushStack = Thread.prototype.pushStack;
            Thread.prototype.pushStack = function (blockId) {
                CoverageGenerator._coverBlock(blockId);
                Thread.real_pushStack.call(this, blockId);
            };
        }
        if (!('real_reuseStackForNextBlock' in Thread)) {
            Thread.real_reuseStackForNextBlock = Thread.prototype.reuseStackForNextBlock;
            Thread.prototype.reuseStackForNextBlock = function (blockId) {
                CoverageGenerator._coverBlock(blockId);
                Thread.real_reuseStackForNextBlock.call(this, blockId);

                // Check if we would like to record the execution trace.
                if (recordExecutionTrace) {
                    const target = this.target;
                    const block = target.blocks.getBlock(this.peekStack());
                    const opcode = target.blocks.getOpcode(block);

                    // Record execution traces for each opcode block.
                    if (opcode) {

                        const otherSpritesName = target.runtime.targets
                            .filter(t => t.sprite).map(t => t.getName());

                        let keysDown = target.runtime.ioDevices.keyboard._keysPressed;
                        keysDown = keysDown.map(x => Util.scratchKeyToKeyString(x));

                        const clockTime = target.runtime.ioDevices.clock.projectTimer();

                        const input = target.blocks.getInputs(block);
                        const inputContent = Object.keys(input).map((key) =>
                            cloneDeep(target.blocks.getBlock(input[key].block))
                        );

                        const stage = target.runtime.getTargetForStage();
                        const stageVariables = cloneDeep(stage.variables);
                        const variables = cloneDeep(target.variables);

                        const renderer = target.renderer;
                        const allDrawableCopy = [];

                        for (const drawable of renderer._allDrawables) {
                            if (!drawable) {
                                continue;
                            }
                            const propertiesToLog = {};
                            propertiesToLog.id = drawable._id;
                            propertiesToLog.posx = drawable._position[0];
                            propertiesToLog.posy = drawable._position[1];
                            propertiesToLog.direction = drawable._direction;
                            propertiesToLog.scalex = drawable._scale[0];
                            propertiesToLog.scaley = drawable._scale[1];
                            propertiesToLog.scaleboth = drawable._scale.slice(0, 2);
                            propertiesToLog.color = drawable._uniforms.u_color;
                            propertiesToLog.whirl = drawable._uniforms.u_whirl;
                            propertiesToLog.fisheye = drawable._uniforms.u_fisheye;
                            propertiesToLog.pixelate = drawable._uniforms.u_pixelate;
                            propertiesToLog.mosaic = drawable._uniforms.u_mosaic;
                            propertiesToLog.brightness = drawable._uniforms.u_brightness;
                            propertiesToLog.ghost = drawable._uniforms.u_ghost;
                            allDrawableCopy.push(propertiesToLog);
                        }

                        testRunner.addExecutionTrace(
                            {
                                clockTime: clockTime,
                                block: {
                                    id: block.id,
                                    opcode: block.opcode,
                                    fields: target.blocks.getFields(block),
                                    inputs: inputContent,
                                    mutation: target.blocks.getMutation(block)
                                },
                                target: {
                                    isStage: target.isStage,
                                    name: target.getName(),
                                    visible: target.visible,
                                    drawableID: target.drawableID,
                                    touching: otherSpritesName.filter(x =>
                                        (x !== target.getName() && target.isTouchingSprite(x))
                                    ),
                                    currentCostume: target.currentCostume,
                                    layerOrder: 'layerOrder' in target ? target.layerOrder : 'undefined',
                                    variables: variables
                                },
                                allDrawables: allDrawableCopy,
                                stageVariables: stageVariables,
                                keysDown: keysDown
                            });
                    }
                }
            };
        }

        threadPreparedForCoverage = true;
    }

    /**
     * @param {Thread: class} classes .
     */
    static restoreClasses (classes) {
        const Thread = classes.Thread;

        if (Thread.hasOwnProperty('real_pushStack')) {
            Thread.prototype.pushStack = Thread.real_pushStack;
            delete Thread.real_pushStack;
        }
        if (Thread.hasOwnProperty('real_reuseStackForNextBlock')) {
            Thread.prototype.reuseStackForNextBlock = Thread.real_reuseStackForNextBlock;
            delete Thread.real_reuseStackForNextBlock;
        }

        threadPreparedForCoverage = false;
    }

    /**
     * @param {number} blockId .
     */
    static _coverBlock (blockId) {
        if (blockId) {
            // if (!_coveredBlockIds.has(blockId)) {
            //     console.log(_blockDescriptions.get(blockId));
            // }
            _coveredBlockIds.add(blockId);
        }
    }

    /**
     * @param {VirtualMachine} vm .
     */
    static prepareVM (vm) {
        _coveredBlockIds.clear();
        _blockIdsPerSprite.clear();
        _blockDescriptions.clear();

        for (const target of vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                const targetName = target.getName();
                let blockIds = _blockIdsPerSprite.get(targetName);
                if (typeof blockIds === 'undefined') {
                    blockIds = new Set();
                    _blockIdsPerSprite.set(targetName, blockIds);
                }

                for (const scriptId of target.blocks.getScripts()) {
                    CoverageGenerator._addBlocks(target.blocks, targetName, scriptId);
                }
            }
        }

        vm.preparedForCoverage = true;
    }

    /**
     * @param {Blocks} targetBlocks .
     * @param {Set<string>} blockIds .
     * @param {string} blockId .
     * @private
     */
    static _addBlocks (targetBlocks, targetName, blockId) {
        const blockIds = _blockIdsPerSprite.get(targetName);
        if (blockIds.has(blockId)) {
            return;
        }

        blockIds.add(blockId);
        _blockDescriptions.set(blockId, {
            sprite: targetName,
            opcode: targetBlocks.getBlock(blockId).opcode,
            id: blockId
        });

        /* Add branches of C-shaped blocks. */
        let branchId = targetBlocks.getBranch(blockId, 1);
        for (let i = 2; branchId !== null; i++) {
            CoverageGenerator._addBlocks(targetBlocks, targetName, branchId);
            branchId = targetBlocks.getBranch(blockId, i);
        }

        /* Add the next block. */
        const nextId = targetBlocks.getNextBlock(blockId);
        if (nextId !== null) {
            CoverageGenerator._addBlocks(targetBlocks, targetName, nextId);
        }
    }

    /**
     * @param {VirtualMachine} vm .
     * @returns {boolean} .
     */
    static isCoverageEnabled (vm) {
        return threadPreparedForCoverage && vm.preparedForCoverage;
    }

    static clearCoverage () {
        _coveredBlockIds.clear();
    }

    /**
     * @return {Map<string, Set<string>>} .
     */
    static getCoveredBlockIdsPerSprite () {
        const coveredMap = new Map();
        for (const [spriteName, blockIds] of _blockIdsPerSprite) {
            const coveredBlockIds = new Set();
            coveredMap.set(spriteName, coveredBlockIds);
            for (const blockId of blockIds) {
                if (_coveredBlockIds.has(blockId)) {
                    coveredBlockIds.add(blockId);
                }
            }
        }
        return coveredMap;
    }

    /**
     * @return {Map<string, Set<string>>} .
     */
    static getBlockIdsPerSprite () {
        const map = new Map();
        for (const [spriteName, blockIds] of _blockIdsPerSprite) {
            map.set(spriteName, new Set(blockIds));
        }
        return map;
    }

    /**
     * @return {Map<string, {sprite: string, opcode: string: id: string}}
     */
    static getBlockDescriptions () {
        return new Map(_blockDescriptions);
    }

    /**
     * @return {Coverage} .
     */
    static getCoverage () {
        return new Coverage(
            CoverageGenerator.getCoveredBlockIdsPerSprite(),
            CoverageGenerator.getBlockIdsPerSprite(),
            CoverageGenerator.getBlockDescriptions()
        );
    }

    /**
     * @param {Coverage[]} coverages .
     * @return {Coverage} .
     */
    /* Assumes the coverage scores are all from the same project. */
    static mergeCoverage (coverages) {
        if (coverages.length === 0) {
            return new Coverage(new Map(), new Map());
        }

        const coveredBlockIdsPerSprite = new Map();
        const blockIdsPerSprite = new Map(coverages[0].blockIdsPerSprite);

        for (const spriteName of coverages[0].coveredBlockIdsPerSprite.keys()) {
            const coveredIdsLists = coverages.map(cov => Array.from(cov.coveredBlockIdsPerSprite.get(spriteName)));
            coveredBlockIdsPerSprite.set(spriteName, new Set([].concat(...coveredIdsLists)));
        }

        return new Coverage(coveredBlockIdsPerSprite, blockIdsPerSprite);
    }
}

module.exports = CoverageGenerator;
