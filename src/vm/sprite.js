const Variable = require('./variable');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');
const ScratchVariable = require('scratch-vm/src/engine/variable');
const Scratch3LooksBlocks = require('scratch-vm/src/blocks/scratch3_looks');

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

        /**
         * @type {Function}
         */
        this.onMoved = null;

        /**
         * @type {Function}
         */
        this.onVisualChange = null;

        this._target.on(RenderedTarget.EVENT_TARGET_MOVED, () => {
            if (this.onMoved) {
                this.onMoved();
            }
        });

        this._target.on(RenderedTarget.EVENT_TARGET_VISUAL_CHANGE, () => {
            if (this.onVisualChange) {
                this.onVisualChange();
            }
        });
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
        for (const variable of this.getVariables(() => true, skipStage)) {
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
     * @param {boolean=} withSelf .
     * @returns {Sprite[]} .
     */
    getClones (withSelf = false) {
        return this._target.sprite.clones
            .filter(target => withSelf || !target.isOriginal)
            .map(this._sprites.wrapTarget.bind(this._sprites));
    }

    /**
     * @returns {Sprite[]} .
     */
    getNewClones () {
        const cloneTargets = this._target.sprite.clones;
        return this._sprites.getNewSprites(s => !s.isOriginal && cloneTargets.indexOf(s.getScratchTarget()) !== -1);
    }

    /**
     * @returns {RenderedTarget} .
     */
    getScratchTarget () {
        return this._target;
    }

    updateOld () {
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
    }

    _update () {
        this.updateOld();
        for (const variable of Object.values(this._variables)) {
            variable.updateOld();
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
        wrapper.updateOld();
        this._variables[variable.id] = wrapper;
        return wrapper;
    }
}


module.exports = Sprite;
