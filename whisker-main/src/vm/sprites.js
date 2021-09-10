const Sprite = require('./sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');

/**
 * Gives the user basic functionality to access and manipulate scratch sprites in whisker tests.
 */
class Sprites {
    constructor (vmWrapper) {

        /**
         * @type {VMWrapper} The wrapper for the vm.
         */
        this.vmWrapper = vmWrapper;

        /**
         * @type {{}} The scratch sprites of the tested project.
         */
        this.sprites = {};

        /**
         * @type {{}} The scratch sprites before the testing start.
         */
        this.spritesBefore = {};

        /**
         * @type {(Function|null)} A function that is called when a sprite moves.
         */
        this._onSpriteMoved = null;

        /**
         * @type {(Function|null)} A function that is called when a sprite changes its visual appearance.
         */
        this._onSpriteVisualChange = null;
    }

    /**
     * Wraps a {@link RenderedTarget} into a {@link Sprite} object to enable access to specific {@link Sprite}
     * functionality.
     * @param {RenderedTarget} target The target to wrap.
     * @returns {Sprite} The wrapped target as a sprite.
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
     * Gives back all stored {@link Sprite Sprites} of the tested project.
     * @param {Function=} condition A condition that the returned sprites have to meet.
     * @param {boolean=} skipStage A value that specifies if the scratch stage should be included.
     * @returns {Sprite[]} An array of the found sprites.
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
     * Gives back all {@link Sprite Sprites} at the coordinates (x, y).
     * @param {number} x The x coordinate of the searched sprites.
     * @param {number} y The y coordinate of the searched sprites.
     * @returns {Sprite[]} An array of the found sprites.
     */
    getSpritesAtPoint (x, y) {
        return this.getSprites()
            .filter(sprite => !sprite.isStage && sprite.isPointInBounds(x, y))
            .sort((a, b) => b.layerOrder - a.layerOrder);
    }

    /**
     * Gives back one {@link Sprite} at the coordinates (x, y).
     * @param {number} x The x coordinate of the searched sprite.
     * @param {number} y The y coordinate of the searched sprite.
     * @returns {?Sprite} The found sprite.
     */
    getSpriteAtPoint (x, y) {
        const sprites = this.getSpritesAtPoint(x, y);
        return (sprites.length > 0) ? sprites[0] : null;
    }

    /**
     * Gives back the {@link Sprite} that has a specific name.
     * @param {string} name The name of the searched sprite.
     * @returns {Sprite} The found sprite.
     */
    getSprite (name) {
        for (const sprite of this.getSprites()) {
            if (sprite.isOriginal && sprite.name === name) {
                return sprite;
            }
        }
    }

    /**
     * Returns the current scratch stage of the tested project.
     * @returns {Sprite} The used stage.
     */
    getStage () {
        return this.wrapTarget(this.vmWrapper.vm.runtime.getTargetForStage());
    }

    /**
     * Gives back new {@link Sprite Sprites} that meet a certain condition.
     * @param {Function=} condition The condition to meet.
     * @returns {Sprite[]} An array of the found sprites.
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

    /**
     * Updates all {@link Sprite Sprites} to have their attributes up-to-date.
     */
    update () {
        for (const sprite of Object.values(this.sprites)) {
            sprite._update();
        }
    }

    /**
     * When a new target is created, it is wrapped as a new {@link Sprite}.
     * @param newTarget The newly created target.
     */
    onTargetCreated (newTarget) {
        if (typeof newTarget.sprite !== 'undefined') {
            this.wrapTarget(newTarget);
        }
    }

    /**
     * Clears out all sprites that are currently stored.
     */
    reset () {
        this.sprites = {};
        this.spritesBefore = {};
    }

    /**
     * When a {@link Sprite} moves, its movement is registered.
     * @param {RenderedTarget} target The moved target.
     */
    doOnSpriteMoved (target) {
        if (this._onSpriteMoved) {
            this._onSpriteMoved(this.wrapTarget(target));
        }
    }

    /**
     * When a {@link Sprite} changes its current appearance, this action is registered.
     * @param {RenderedTarget} target The changed target.
     */
    doOnSpriteVisualChange (target) {
        if (this._onSpriteVisualChange) {
            this._onSpriteVisualChange(this.wrapTarget(target));
        }
    }

    /**
     * When a {@link Sprite} moved, a specific function is called.
     * @param {(Function|null)} func The function to call.
     */
    onSpriteMoved (func) {
        this._onSpriteMoved = func;
    }

    /**
     * When a {@link Sprite} changes its visual appearance, a specific function is called.
     * @param {(Function|null)} func The function to call.
     */
    onSpriteVisualChange (func) {
        this._onSpriteVisualChange = func;
    }
}

module.exports = Sprites;
