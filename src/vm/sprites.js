const Sprite = require('./sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');

class Sprites {
    /**
     * @param {VMWrapper} vmWrapper .
     */
    constructor (vmWrapper) {
        /**
         * @type {VMWrapper} .
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {{}}
         */
        this.sprites = {};

        /**
         * @type {{}}
         */
        this.spritesBefore = {};

        /**
         * @type {(Function|null)}
         */
        this._onSpriteMoved = null;

        /**
         * @type {(Function|null)}
         */
        this._onSpriteVisualChange = null;
    }

    /**
     * @param {RenderedTarget} target .
     * @returns {Sprite} .
     */
    wrapTarget (target) {
        let wrapper = this.sprites[target.id];
        if (wrapper) {
            return wrapper;
        }

        wrapper = new Sprite(target, this, this.vmWrapper.vm.runtime);
        wrapper._update();
        this.sprites[target.id] = wrapper;

        target.on(RenderedTarget.EVENT_TARGET_MOVED, this.doOnSpriteMoved.bind(this));
        target.on(RenderedTarget.EVENT_TARGET_VISUAL_CHANGE, this.doOnSpriteVisualChange.bind(this));

        return wrapper;
    }

    /**
     * @param {Function=} condition .
     * @param {boolean=} skipStage .
     * @returns {Sprite[]} .
     */
    getSprites (condition, skipStage = true) {
        let sprites = this.vmWrapper.vm.runtime.targets
            .filter(target => target.sprite)
            .map(this.wrapTarget.bind(this));

        if (skipStage) {
            sprites = sprites.filter(sprite => !sprite.isStage);
        }

        if (condition) {
            sprites = sprites.filter(condition);
        }

        return sprites;
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @returns {Sprite[]} .
     */
    getSpritesAtPoint (x, y) {
        return this.getSprites()
            .filter(sprite => !sprite.isStage && sprite.isPointInBounds(x, y))
            .sort((a, b) => b.layerOrder - a.layerOrder);
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @returns {?Sprite} .
     */
    getSpriteAtPoint (x, y) {
        const sprites = this.getSpritesAtPoint(x, y);
        return (sprites.length > 0) ? sprites[0] : null;
    }

    /**
     * @param {string} name .
     * @returns {Sprite} .
     */
    getSprite (name) {
        for (const sprite of this.getSprites()) {
            if (sprite.isOriginal && sprite.name === name) {
                return sprite;
            }
        }
    }

    /**
     * @returns {Sprite} .
     */
    getStage () {
        return this.wrapTarget(this.vmWrapper.vm.runtime.getTargetForStage());
    }

    /**
     * @param {Function=} condition .
     * @returns {Sprite[]} .
     */
    getNewSprites (condition) {
        condition = condition || (() => true);

        const newSprites = [];
        for (const target of this.vmWrapper.vm.runtime.targets) {
            if (!this.spritesBefore.hasOwnProperty(target.id)) {
                const sprite = this.wrapTarget(target);
                if (condition(sprite)) {
                    this.spritesBefore[target.id] = sprite;
                    newSprites.push(sprite);
                }
            }
        }
        return newSprites;
    }

    update () {
        for (const sprite of Object.values(this.sprites)) {
            sprite._update();
        }
    }

    reset () {
        this.sprites = {};
        this.spritesBefore = {};
    }

    /**
     * @param {RenderedTarget} target .
     */
    doOnSpriteMoved (target) {
        if (this._onSpriteMoved) {
            this._onSpriteMoved(this.wrapTarget(target));
        }
    }

    /**
     * @param {RenderedTarget} target .
     */
    doOnSpriteVisualChange (target) {
        if (this._onSpriteVisualChange) {
            this._onSpriteVisualChange(this.wrapTarget(target));
        }
    }

    /**
     * @param {(Function|null)} func .
     */
    onSpriteMoved (func) {
        this._onSpriteMoved = func;
    }

    /**
     * @param {(Function|null)} func .
     */
    onSpriteVisualChange (func) {
        this._onSpriteVisualChange = func;
    }
}

module.exports = Sprites;
