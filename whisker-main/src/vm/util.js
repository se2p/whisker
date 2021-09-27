/**
 * Names used internally for keys used in scratch, also known as 'scratch keys'.
 * @type {{SPACE: string, DOWN: string, LEFT: string, RIGHT: string, ENTER: string, UP: string}}
 */
const SCRATCH_KEY = {
    SPACE: 'space',
    LEFT: 'left arrow',
    UP: 'up arrow',
    RIGHT: 'right arrow',
    DOWN: 'down arrow',
    ENTER: 'enter'
};

/**
 * Names used for events, when a key is pressed, also known as 'keyboard keys'.
 * @type {{SPACE: string, DOWN: string, LEFT: string, ARROW_RIGHT: string, ARROW_DOWN: string, RIGHT: string, ENTER: string, UP: string, ARROW_UP: string, ARROW_LEFT: string}}
 */
const KEYBOARD_KEY = {
    SPACE: ' ',
    LEFT: 'Left',
    ARROW_LEFT: 'ArrowLeft',
    UP: 'Up',
    ARROW_UP: 'ArrowUp',
    RIGHT: 'Right',
    ARROW_RIGHT: 'ArrowRight',
    DOWN: 'Down',
    ARROW_DOWN: 'ArrowDown',
    ENTER: 'Enter'
};

/**
 * Utility functionality for whisker tests.
 */
// TODO: Split vm-wrapper it two: One wrapper that provides utility functions
// and another wrapper around it, that the controls the testing.
class Util {

    /**
     * Converts the scratch key string into a keyboard key event string.
     * @param {string} scratchKey The scratch key to convert.
     * @return {string} The converted keyboard key.
     */
    static scratchKeyToKeyString (scratchKey) {
        switch (scratchKey) {
            case SCRATCH_KEY.SPACE:
                return KEYBOARD_KEY.SPACE;
            case SCRATCH_KEY.LEFT:
                return KEYBOARD_KEY.LEFT;
            case SCRATCH_KEY.UP:
                return KEYBOARD_KEY.UP;
            case SCRATCH_KEY.RIGHT:
                return KEYBOARD_KEY.RIGHT;
            case SCRATCH_KEY.DOWN:
                return KEYBOARD_KEY.DOWN;
            case SCRATCH_KEY.ENTER:
                return KEYBOARD_KEY.ENTER;
            default:
                return scratchKey;
        }
    }

    /**
     * Converts the keyboard key event string into a scratch key string.
     * @param {string} keyString The keyboard key to convert.
     * @return keyString The converted scratch key.
     */
    static keyStringToScratchKey (keyString) {
        switch (keyString) {
            case KEYBOARD_KEY.SPACE:
                return SCRATCH_KEY.SPACE;
            case KEYBOARD_KEY.ARROW_LEFT:
            case KEYBOARD_KEY.LEFT:
                return SCRATCH_KEY.LEFT;
            case KEYBOARD_KEY.ARROW_UP:
            case KEYBOARD_KEY.UP:
                return SCRATCH_KEY.UP;
            case KEYBOARD_KEY.ARROW_RIGHT:
            case KEYBOARD_KEY.RIGHT:
                return SCRATCH_KEY.RIGHT;
            case KEYBOARD_KEY.ARROW_DOWN:
            case KEYBOARD_KEY.DOWN:
                return SCRATCH_KEY.DOWN;
            case KEYBOARD_KEY.ENTER:
                return SCRATCH_KEY.ENTER;
            default:
                return keyString;
        }
    }

    /**
     * Converts scratch coordinates to be relative to the client.
     * @param {VirtualMachine} vm The currently used virtual machine.
     * @param {number} x The x coordinate on the scratch canvas.
     * @param {number} y The y coordinate on the scratch canvas.
     * @return {{x: number, y: number}} The coordinates relative to the client.
     */
    static getClientCoords (vm, x, y) {
        const rect = vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = vm.runtime.renderer.getNativeSize();
        return {
            x: (x * (rect.width / nWidth)) + (rect.width / 2),
            y: (-y * (rect.height / nHeight)) + (rect.height / 2)
        };
    }

    /**
     * Converts coordinates to be relative to the scratch canvas.
     * @param {VirtualMachine} vm The currently used virtual machine.
     * @param {number} x The x coordinate on the client.
     * @param {number} y The y coordinate on the client.
     * @return {{x: number, y: number}} The converted coordinates.
     */
    static getScratchCoords (vm, x, y) {
        const rect = vm.runtime.renderer.gl.canvas.getBoundingClientRect();
        const [nWidth, nHeight] = vm.runtime.renderer.getNativeSize();
        return {
            x: (nWidth / rect.width) * (x - (rect.width / 2)),
            y: -(nHeight / rect.height) * (y - (rect.height / 2))
        };
    }

    /**
     * Returns the {@link RenderedTarget} that was touched by the mouse, either a sprite or the stage.
     * @param {VirtualMachine} vm The currently used virtual machine.
     * @return {RenderedTarget} The searched target.
     */
    static getTargetSprite (vm) {
        let stage;
        for (const target of vm.runtime.targets) {
            if (target.isStage) {
                stage = target;
            } else if (this._isTouchingMouse(vm, target)) {
                return target;
            }
        }
        return stage;
    }

    /**
     * Evaluates if a {@link RenderedTarget} is touching the mouse in this exact moment.
     * @param {VirtualMachine} vm The currently used virtual machine.
     * @param {RenderedTarget} target The sprite in question.
     * @returns {boolean} true if mouse touches target, false otherwise.
     * @private
     */
    static _isTouchingMouse (vm, target) {
        const mousePos = this._getMousePos(vm);
        if (isNaN(mousePos.x) || isNaN(mousePos.y)) {
            return false;
        }
        return target.isTouchingObject('_mouse_');
    }

    /**
     * Gives back the current coordinates of the mouse position on the scratch canvas.
     * @param {VirtualMachine} vm The currently used virtual machine.
     * @returns {{x: number, y: number}} The current mouse position.
     * @private
     */
    static _getMousePos (vm) {
        return {
            x: vm.runtime.ioDevices.mouse.getScratchX(),
            y: vm.runtime.ioDevices.mouse.getScratchY()
        };
    }
}

module.exports = Util;
