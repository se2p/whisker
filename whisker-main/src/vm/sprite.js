const Variable = require('./variable');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');
const ScratchVariable = require('scratch-vm/src/engine/variable');
const Scratch3LooksBlocks = require('scratch-vm/src/blocks/scratch3_looks');

/**
 * Represents a scratch {@link Sprite} by wrapping a {@link RenderedTarget} and gives the user basic functionality to
 * access and manipulate a specific sprite.
 */
class Sprite {
    constructor (target, sprites, runtime) {

        /**
         * @type {Sprites} An array of sprites.
         * @private
         */
        this._sprites = sprites;

        /**
         * @type {Runtime} The current runtime environment.
         * @private
         */
        this._runtime = runtime;

        /**
         * @type {RenderedTarget} The target this sprite is wrapping.
         */
        this._target = target;

        /**
         * @type {Object} The old value of the sprite.
         * @private
         */
        this._old = {};

        /**
         * @type {Object<string,Variable>} An array of variables of the sprite.
         * @private
         */
        this._variables = {};

        /**
         * @type {Function} A function that is called when this sprite moves.
         */
        this.onMoved = null;

        /**
         * @type {Function} A function that is called when this sprite changes its visual appearance.
         */
        this.onVisualChange = null;

        this._target.on(RenderedTarget.EVENT_TARGET_MOVED, (target, oldX, oldY) => {
            this._old.x = oldX;
            this._old.y = oldY;
            if (this.onMoved) {
                this.onMoved(target);
            }
        });

        this._target.on(RenderedTarget.EVENT_TARGET_VISUAL_CHANGE, () => {
            if (this.onVisualChange) {
                this.onVisualChange();
            }
        });
    }

    /**
     * Evaluates if the wrapped {@link RenderedTarget} can be found.
     * @returns {boolean} true if target exists, false otherwise.
     */
    get exists () {
        return Boolean(this._runtime.getTargetById(this.id));
    }

    /**
     * Gives back the old value of this {@link Sprite}.
     * @returns {object} .
     */
    get old () {
        return {...this._old};
    }

    /**
     * Gives back if the wrapped {@link RenderedTarget} is its original version.
     * @returns {boolean} true if sprite is original, false otherwise.
     */
    get isOriginal () {
        return this._target.isOriginal;
    }

    /**
     * Gives back if the wrapped {@link RenderedTarget} is a stage.
     * @returns {boolean} true if sprite is stage, false otherwise.
     */
    get isStage () {
        return this._target.isStage;
    }

    /**
     * Gives back the name of the name of the wrapped {@link RenderedTarget}.
     * @returns {string} The sprite name.
     */
    get name () {
        return this._target.sprite.name;
    }

    /**
     * Gives back the id of the wrapped {@link RenderedTarget}.
     * @returns {string} The sprite id.
     */
    get id () {
        return this._target.id;
    }

    /**
     * Gives back the stored effects of the wrapped {@link RenderedTarget}.
     * @returns {Object.<string, number>} Map of graphic effect values.
     */
    get effects () {
        return {...this._target.effects};
    }

    /**
     * Gives back the x coordinate of the wrapped {@link RenderedTarget} on the scratch canvas.
     * @returns {number} The x coordinate.
     */
    get x () {
        return this._target.x;
    }

    /**
     * Gives back the y coordinate of the wrapped {@link RenderedTarget} on the scratch canvas.
     * @returns {number} The y coordinate.
     */
    get y () {
        return this._target.y;
    }

    /**
     * Gives back the position of the wrapped {@link RenderedTarget} on the scratch canvas.
     * @return {{x: number, y: number}} The sprite coordinates.
     */
    get pos () {
        return {
            x: this.x,
            y: this.y
        };
    }

    /**
     * Gives back the direction of the wrapped {@link RenderedTarget}.
     * @returns {number} The sprite direction with range between -179 to 180.
     */
    get direction () {
        return this._target.direction;
    }

    /**
     * Gives back if the wrapped {@link RenderedTarget} is currently visible on the scratch canvas.
     * @returns {boolean} true if sprite is visible, false otherwise.
     */
    get visible () {
        return this._target.visible;
    }

    /**
     * Gives back the size of the wrapped {@link RenderedTarget} on the scratch canvas.
     * @returns {number} The size as a percentage of the costume size.
     */
    get size () {
        return Math.round(this._target.size);
    }

    /**
     * Gives back the costume the wrapped {@link RenderedTarget} is currently wearing.
     * @returns {number} The currently selected costume index.
     */
    get currentCostume () {
        return this._target.currentCostume;
    }

    /**
     * Get the name of the costume the wrapped {@link RenderedTarget} is currently wearing.
     * @return {string} The currently selected costume name.
     */
    get currentCostumeName () {
        if (this._target.sprite.costumes !== undefined && this._target.sprite.costumes.length !== 0) {
            return this._target.sprite.costumes[this._target.currentCostume].name;
        } else {
            return undefined;
        }
    }

    /**
     * Gives back the volume of the wrapped {@link RenderedTarget}.
     * @returns {number} Sound loudness as percentage.
     */
    get volume () {
        return this._target.volume;
    }

    /**
     * Gives back the current layer order.
     * @returns {number} The layer order.
     */
    get layerOrder () {
        return this._target.getLayerOrder();
    }

    /**
     * Gives back text message the {@link Sprite} is currently saying.
     * @returns {?string} The said text if sprite is talking, null otherwise.
     */
    get sayText () {
        const bubbleState = this._target.getCustomState(Scratch3LooksBlocks.STATE_KEY);
        if (bubbleState) {
            return bubbleState.text;
        }
        return null;
    }

    /**
     * Gives back the rotation style of the the wrapped {@link RenderedTarget}.
     * @return {!string} Either 'all around', 'left-right' or 'don't rotate'.
     */
    get rotationStyle() {
        return this._target.rotationStyle;
    }

    /**
     * Gives back the bounds in which the wrapped {@link RenderedTarget} can be found on the scratch canvas.
     * @returns {{
     *     left: number,
     *     right: number,
     *     top: number,
     *     bottom: number
     * }} Tight bounding box or null.
     */
    get bounds () {
        return this._target.getBounds();
    }

    /* ===== Target functions ===== */

    /**
     * Evaluates if specific coordinates (x, y) on the scratch canvas are inside of the {@link Sprite Sprite's} bounds.
     * @param {number} x The x coordinate.
     * @param {number} y The y coordinate.
     * @returns {boolean} true if point is in bounds, false otherwise.
     */
    isPointInBounds (x, y) {
        const bounds = this.bounds;
        return x >= bounds.left &&
            x <= bounds.right &&
            y >= bounds.bottom &&
            y <= bounds.top;
    }

    /**
     * Evaluates if two bounding boxes are overlapping each other.
     * @param {{
     *     left: number,
     *     right: number,
     *     top: number,
     *     bottom: number
     * }} otherBounds Bounds to check overlap with.
     * @returns {boolean} true if bounds are intersecting, false otherwise.
     */
    isIntersectingBounds (otherBounds) {
        const bounds = this.bounds;
        return bounds.left <= otherBounds.right &&
            bounds.right >= otherBounds.left &&
            bounds.top >= otherBounds.bottom &&
            bounds.bottom <= otherBounds.top;
    }

    /**
     * Evaluates if this {@link Sprite} is touching the mouse.
     * @returns {boolean} true if mouse is touched, false otherwise.
     */
    isTouchingMouse () {
        const mousePos = this._sprites.vmWrapper.inputs.getMousePos();
        if (isNaN(mousePos.x) || isNaN(mousePos.y)) {
            return false;
        }
        return this._target.isTouchingObject('_mouse_');
    }

    /**
     * Evaluates if this {@link Sprite} is touching the edge of the scratch canvas.
     * @returns {boolean} true if the edge is touched, false otherwise.
     */
    isTouchingEdge () {
        return this._target.isTouchingEdge();
    }

    /**
     * Whether the wrapped {@link RenderedTarget} touches a vertical boundary of the Scratch canvas.
     * @returns {boolean}  true if a vertical edge is touched, false otherwise.
     */
    isTouchingVerticalEdge () {
        return this._target.isTouchingVerticalEdge();
    }

    /**
     * Whether the wrapped {@link RenderedTarget} touches a horizontal boundary of the Scratch canvas.
     * @returns {boolean}  true if a horizontal edge is touched, false otherwise.
     */
    isTouchingHorizEdge () {
        return this._target.isTouchingHorizEdge();
    }

    /**
     * Evaluates if another {@link Sprite} is touching this one.
     * @param {string} spriteName Name of the sprite to check.
     * @returns {boolean} true if sprites are touching each other, false otherwise.
     */
    isTouchingSprite (spriteName) {
        return this._target.isTouchingSprite(spriteName);
    }

    /**
     * Evaluates if this {@link Sprite} is touching a specific color.
     * @param {number[]} rgb The color to check.
     * @returns {boolean} true if the color is touched, false otherwise.
     */
    isTouchingColor (rgb) {
        return this._target.isTouchingColor(rgb);
    }

    /**
     * Evaluates if two colors are touching each other.
     * @param {number[]} targetRgb The first color in rgb form.
     * @param {number[]} maskRgb The second color in rgb form.
     * @returns {boolean} true if colors are touching each other, false otherwise.
     */
    isColorTouchingColor (targetRgb, maskRgb) {
        return this._target.colorIsTouchingColor(targetRgb, maskRgb);
    }

    /**
     * Gives back all {@link Variable Variables} that are stored in this {@link Sprite}.
     * @param {Function=} condition Condition the variables have to meet.
     * @param {boolean=} skipStage Indicates if the scratch stage should be included.
     * @returns {Variable[]} An array of scratch variables.
     */
    getVariables (condition, skipStage = true) {
        const originalVariables = this._target.getAllVariableNamesInScopeByType(ScratchVariable.SCALAR_TYPE, skipStage)
            .map(name => this._target.lookupVariableByNameAndType(name, ScratchVariable.SCALAR_TYPE, skipStage));

        let variables = originalVariables.map(this._wrapVariable.bind(this));

        if (condition) {
            variables = variables.filter(variable => condition(variable));
        }

        return variables;
    }

    /**
     * Gives back all lists that are stored in this {@link Sprite}.
     * @param {boolean=} skipStage Indicates if the scratch stage should be included.
     * @returns {Variable[]} An array of scratch variables.
     */
    getLists (skipStage = true) {
        const originalVariables = this._target.getAllVariableNamesInScopeByType(ScratchVariable.LIST_TYPE, skipStage)
            .map(name => this._target.lookupVariableByNameAndType(name, ScratchVariable.LIST_TYPE, skipStage));

        return originalVariables.map(this._wrapVariable.bind(this));
    }

    /**
     * Gives back a {@link Variable} with a specific name.
     * @param {string} name The name of the search variable.
     * @param {boolean=} skipStage Indicates if the scratch stage is included.
     * @returns {Variable} The searched scratch variable or null.
     */
    getVariable (name, skipStage = true) {
        for (const variable of this.getVariables(() => true, skipStage)) {
            if (variable.name === name) {
                return variable;
            }
        }
    }

    /**
     * Gives back a specific list of this {@link Sprite}.
     * @param {string} name The name of the searched list.
     * @param {boolean=} skipStage Indicates if the scratch stage is included.
     * @returns {Variable} The searched variable or null.
     */
    getList (name, skipStage = true) {
        for (const list of this.getLists(skipStage)) {
            if (list.name === name) {
                return list;
            }
        }
    }

    /**
     * Gives back all instances of this {@link Sprite}, which includes the original as well as all clones.
     * @returns {Sprite[]} An array of sprites.
     */
    getInstances () {
        return this._target.sprite.clones.map(this._sprites.wrapTarget.bind(this._sprites));
    }

    /**
     * Gives back the original of this scratch {@link Sprite}.
     * @returns {Sprite} The original sprite.
     */
    getOriginal () {
        for (const target of this._target.sprite.clones) {
            if (target.isOriginal) {
                return this._sprites.wrapTarget(target);
            }
        }
    }

    /**
     * Gives back all clones of this {@link Sprite}.
     * @param {boolean=} withSelf Indicates if the original sprite is included.
     * @returns {Sprite[]} An array of sprites.
     */
    getClones (withSelf = false) {
        return this._target.sprite.clones
            .filter(target => withSelf || !target.isOriginal)
            .map(this._sprites.wrapTarget.bind(this._sprites));
    }

    /**
     * Gives back all newly created clones.
     * @returns {Sprite[]} An array of sprites.
     */
    getNewClones () {
        const cloneTargets = this._target.sprite.clones;
        return this._sprites.getNewSprites(s => !s.isOriginal && cloneTargets.indexOf(s.getScratchTarget()) !== -1);
    }

    /**
     * Gives back clone of the given index.
     * @param index The index of the clone.
     * @returns {!RenderedTarget} The requested clone.
     */
    getClone (index) {
        return this._target.sprite.clones[index];
    }

    /**
     * Gives back the number of clones for this {@link RenderedTarget}.
     * @param withSelf Indicates if the original sprite is included.
     * @returns {number} The number of clones.
     */
    getCloneCount (withSelf = false) {
        return this.getClones(withSelf).length;
    }

    /**
     * Gives back the list of all stored costumes of this {@link RenderedTarget}.
     * @returns {Object[]} List of costumes.
     */
    getCostumes () {
        return this._target.getCostumes();
    }

    /**
     * Gives back the costume with the given index.
     * @param index The index of the searched costume.
     * @returns {Object} The requested costume.
     */
    getCostumeByIndex (index) {
        return this._target.getCostumes()[index];
    }

    /**
     * Gives back the costume with the given name.
     * @param name The name of the searched costume.
     * @returns {Object} The requested costume.
     */
    getCostumeByName (name) {
        return this.getCostumes().filter(costume => costume.name.match(name))[0];
    }

    /**
     * Gives back the number of costumes this {@link RenderedTarget} has.
     * @returns {number} The number of costumes.
     */
    getCostumeCount () {
        return this._target.getCostumes().length;
    }

    /**
     * Gives back the wrapped {@link RenderedTarget} of this {@link Sprite}.
     * @returns {RenderedTarget} The wrapped target.
     */
    getScratchTarget () {
        return this._target;
    }

    /**
     * Updates the old attribute values of this {@link Sprite}.
     */
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
        this._old.rotationStyle = this.rotationStyle;
        this._old.currentCostumeName = this.currentCostumeName;
    }

    /**
     * Updates the old attribute values of this {@link Sprite} as well as its stored variables.
     * @private
     */
    _update () {
        this.updateOld();
        for (const variable of Object.values(this._variables)) {
            variable.updateOld();
        }
    }

    updateVariables(variableName, newValue, oldValue) {
        for (const variable of Object.values(this._variables)) {
            if (variable.name === variableName) {
                variable.setOldValue(oldValue);
            }
        }
    }

    /**
     * Creates a new {@link Variable} by wrapping a {@link ScratchVariable} into an object.
     * @param {ScratchVariable} variable The variable to wrap.
     * @returns {Variable} The new variable object.
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
