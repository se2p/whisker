/**
 * Utility functionality for whisker tests.
 */
// TODO: Split vm-wrapper it two: One wrapper that provides utility functions
// and another wrapper around it, that the controls the testing.
class Util {

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
