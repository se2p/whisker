const Scratch3LooksBlocks = require('scratch-vm/src/blocks/scratch3_looks');
const ScratchVariable = require('scratch-vm/src/engine/variable');

class Variable {
    constructor (variable, sprite) {

        /**
         * @type {ScratchVariable}
         * @private
         */
        this._variable = variable;

        /**
         * @type {RenderedTarget}
         * @private
         */
        this._sprite = sprite;

        /**
         * @type {Object}
         * @private
         */
        this._old = {};
    }

    /**
     * @returns {string} .
     */
    get name () {
        return this._variable.name;
    }

    /**
     * @returns {number|number[]} .
     */
    get value () {
        if (this._variable.type === ScratchVariable.SCALAR_TYPE) {
            return this._variable.value;
        } else if (this._variable.type === ScratchVariable.LIST_TYPE) {
            return [...this._variable.value];
        }
        return null;
    }

    /**
     * @returns {object} .
     */
    get old () {
        return {...this._old};
    }

    /**
     * @returns {object} .
     */
    get sprite () {
        return this._sprite;
    }

    /**
     * @returns {ScratchVariable} .
     */
    getScratchVariable () {
        return this._variable;
    }

    _update () {
        this._old.value = this.value;
    }
}

class Sprite {
    constructor (target, sprites, runtime) {

        /**
         * @type {Sprites}
         * @private
         */
        this._sprites = sprites;

        /**
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * @type {RenderedTarget}
         */
        this._target = target;

        /**
         * @type {Object}
         * @private
         */
        this._old = {};

        /**
         * @type {Object<string,Variable>}
         * @private
         */
        this._variables = {};
    }

    /**
     * @returns {boolean} .
     */
    get exists () {
        return Boolean(this._runtime.getTargetById(this.id));
    }

    /**
     * @returns {object} .
     */
    get old () {
        return {...this._old};
    }

    /**
     * @returns {boolean} .
     */
    get isOriginal () {
        return this._target.isOriginal;
    }

    /**
     * @returns {boolean} .
     */
    get isStage () {
        return this._target.isStage;
    }

    /**
     * @returns {string} .
     */
    get name () {
        return this._target.sprite.name;
    }

    /**
     * @returns {string} .
     */
    get id () {
        return this._target.id;
    }

    /**
     * @returns {object.<string, number>} .
     */
    get effects () {
        return {...this._target.effects};
    }

    /**
     * @returns {number} .
     */
    get x () {
        return this._target.x;
    }

    /**
     * @returns {number} .
     */
    get y () {
        return this._target.y;
    }

    /**
     * @return {{x: number, y: number}} .
     */
    get pos () {
        return {
            x: this.x,
            y: this.y
        };
    }

    /**
     * @returns {number} .
     */
    get direction () {
        return this._target.direction;
    }

    /**
     * @returns {boolean} .
     */
    get visible () {
        return this._target.visible;
    }

    /**
     * @returns {number} .
     */
    get size () {
        return this._target.size;
    }

    /**
     * @returns {number} .
     */
    get currentCostume () {
        return this._target.currentCostume;
    }

    /**
     * @returns {number} .
     */
    get volume () {
        return this._target.volume;
    }

    /**
     * @returns {number} .
     */
    get layerOrder () {
        return this._target.getLayerOrder();
    }

    /**
     * @returns {?string} .
     */
    get sayText () {
        const bubbleState = this._target.getCustomState(Scratch3LooksBlocks.STATE_KEY);
        if (bubbleState) {
            return bubbleState.text;
        }
        return null;
    }

    /**
     * @returns {{
     *     left: number,
     *     right: number,
     *     top: number,
     *     bottom: number
     * }} .
     */
    get bounds () {
        return this._target.getBounds();
    }

    /* ===== Target functions ===== */

    /**
     * @param {number} x .
     * @param {number} y .
     * @returns {boolean} .
     */
    isPointInBounds (x, y) {
        const bounds = this.bounds;
        return x >= bounds.left &&
               x <= bounds.right &&
               y >= bounds.bottom &&
               y <= bounds.top;
    }

    /**
     * @param {{
     *     left: number,
     *     right: number,
     *     top: number,
     *     bottom: number
     * }} otherBounds .
     * @returns {boolean} .
     */
    isIntersectingBounds (otherBounds) {
        const bounds = this.bounds;
        return bounds.left <= otherBounds.right &&
               bounds.right >= otherBounds.left &&
               bounds.top >= otherBounds.bottom &&
               bounds.bottom <= otherBounds.top;
    }

    /**
     * @returns {boolean} .
     */
    isTouchingMouse () {
        const mousePos = this._sprites.vmWrapper.inputs.getMousePos();
        if (isNaN(mousePos.x) || isNaN(mousePos.y)) {
            return false;
        }
        return this._target.isTouchingObject('_mouse_');
    }

    /**
     * @returns {boolean} .
     */
    isTouchingEdge () {
        return this._target.isTouchingEdge();
    }

    /**
     * @param {string} spriteName .
     * @returns {boolean} .
     */
    isTouchingSprite (spriteName) {
        return this._target.isTouchingSprite(spriteName);
    }

    /**
     * @param {number[]} rgb .
     * @returns {boolean} .
     */
    isTouchingColor (rgb) {
        return this._target.isTouchingColor(rgb);
    }

    /**
     * @param {number[]} targetRgb .
     * @param {number[]} maskRgb .
     * @returns {boolean} .
     */
    isColorTouchingColor (targetRgb, maskRgb) {
        return this._target.colorIsTouchingColor(targetRgb, maskRgb);
    }

    /**
     * @param {Function=} condition .
     * @param {boolean=} skipStage .
     * @returns {Variable[]} .
     */
    getVariables (condition, skipStage = true) {
        const originalVariables = this._target.getAllVariableNamesInScopeByType(ScratchVariable.SCALAR_TYPE, skipStage)
            .map(name => this._target.lookupVariableByNameAndType(name, ScratchVariable.SCALAR_TYPE, skipStage));

        let variables = originalVariables.map(this._wrapVariable.bind(this));

        if (!skipStage && !this.isStage) {
            variables = variables.concat(this._sprites.getStage().getVariables(skipStage));
        }

        if (condition) {
            variables = variables.filter(variable => condition(variable));
        }

        return variables;
    }

    /**
     * @param {boolean=} skipStage .
     * @returns {Variable[]} .
     */
    getLists (skipStage = true) {
        const originalVariables = this._target.getAllVariableNamesInScopeByType(ScratchVariable.LIST_TYPE, skipStage)
            .map(name => this._target.lookupVariableByNameAndType(name, ScratchVariable.SCALAR_TYPE, skipStage));
        let wrappedVariables = originalVariables.map(this._wrapVariable.bind(this));
        if (!skipStage && !this.isStage) {
            wrappedVariables = wrappedVariables.concat(this._sprites.getStage().getLists(skipStage));
        }
        return wrappedVariables;
    }

    /**
     * @param {string} name .
     * @param {boolean=} skipStage .
     * @returns {Variable} .
     */
    getVariable (name, skipStage = true) {
        for (const variable of this.getVariables(skipStage)) {
            if (variable.name === name) {
                return variable;
            }
        }
    }

    /**
     * @param {string} name .
     * @param {boolean=} skipStage .
     * @returns {Variable} .
     */
    getList (name, skipStage = true) {
        for (const list of this.getLists(skipStage)) {
            if (list.name === name) {
                return list;
            }
        }
    }

    /**
     * @returns {Sprite[]} .
     */
    getInstances () {
        return this._target.sprite.clones.map(this._sprites.wrapTarget.bind(this._sprites));
    }

    /**
     * @returns {Sprite} .
     */
    getOriginal () {
        for (const target of this._target.sprite.clones) {
            if (target.isOriginal) {
                return this._sprites.wrapTarget(target);
            }
        }
    }

    /**
     * @returns {Sprite[]} .
     */
    getClones () {
        return this._target.sprite.clones
            .filter(target => !target.isOriginal)
            .map(this._sprites.wrapTarget.bind(this._sprites));
    }

    /**
     * @returns {RenderedTarget} .
     */
    getScratchTarget () {
        return this._target;
    }

    _update () {
        this._old.effects = this.effects;
        this._old.x = this.x;
        this._old.y = this.y;
        this._old.pos = {...this.pos};
        this._old.direction = this.direction;
        this._old.visible = this.visible;
        this._old.size = this.size;
        this._old.currentCostume = this.currentCostume;
        this._old.volume = this.volume;
        this._old.layerOrder = this.layerOrder;
        this._old.sayText = this.sayText;
        for (const variable of Object.values(this._variables)) {
            variable._update();
        }
    }

    /**
     * @param {ScratchVariable} variable .
     * @returns {Variable} .
     * @private
     */
    _wrapVariable (variable) {
        let wrapper = this._variables[variable.id];
        if (wrapper) {
            return wrapper;
        }
        wrapper = new Variable(variable, this);
        wrapper._update();
        this._variables[variable.id] = wrapper;
        return wrapper;
    }
}

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

    update () {
        for (const sprite of Object.values(this.sprites)) {
            sprite._update();
        }
    }

    reset () {
        this.sprites = {};
    }
}

module.exports = {
    Variable,
    Sprite,
    Sprites
};
