const _coveredBlockIds = new Set();
const _blockIdsPerSprite = new Map();
const _blockDescriptions = new Map();

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
     * @param {Thread: class} classes .
     */
    static prepareClasses (classes) {
        const Thread = classes.Thread;

        if (!Thread.hasOwnProperty('real_pushStack')) {
            Thread.real_pushStack = Thread.prototype.pushStack;
            Thread.prototype.pushStack = function (blockId) {
                CoverageGenerator._coverBlock(blockId);
                Thread.real_pushStack.call(this, blockId);
            };
        }
        if (!Thread.hasOwnProperty('real_reuseStackForNextBlock')) {
            Thread.real_reuseStackForNextBlock = Thread.prototype.reuseStackForNextBlock;
            Thread.prototype.reuseStackForNextBlock = function (blockId) {
                CoverageGenerator._coverBlock(blockId);
                Thread.real_reuseStackForNextBlock.call(this, blockId);
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
