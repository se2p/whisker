class Util {
    // TODO: Split vm-wrapper it two: One wrapper that provides utility functions,
    // and another wrapper around it, that the controls the testing.

    /**
     * @param {VirtualMachine} vm .
     * @param {number} x .
     * @param {number} y .
     * @return {{x: number, y: number}} .
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
     * @param {VirtualMachine} vm .
     * @param {number} x .
     * @param {number} y .
     * @return {{x: number, y: number}} .
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
     * @param {VirtualMachine} vm .
     * @param {string} keyString .
     * @return {string} .
     */
    static getScratchKey (vm, keyString) {
        return vm.runtime.ioDevices.keyboard._keyStringToScratchKey(keyString);
    }

    /**
     * @param {string} target .
     * @param {number} steps .
     * @returns {string} .
     */
    static clickSprite (target, steps) {
        return '    t.clickSprite(\''+ target +'\', '+ steps +');';
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @param {number} steps .
     * @returns {string} .
     */
    static clickClone (x, y, steps) {
        return '    t.clickClone('+ x +', '+ y +', '+ steps +');';
    }

    /**
     * @param {string} target .
     * @param {number} x .
     * @param {number} y .
     * @returns {string} .
     */
    static dragSprite (target, x, y) {
        return '    t.dragSprite(\''+ target +'\', '+ x +', '+ y +');';
    }

    /**
     * @returns {string} .
     */
    static clickStage () {
        return '    t.clickStage();';
    }

    /**
     * @param {string} key .
     * @param {number} steps .
     * @returns {string} .
     */
    static keyPress(key, steps) {
        return '    t.keyPress(\''+ key +'\', '+ steps +');';
    }

    /**
     * @param {boolean} value .
     * @returns {string} .
     */
    static mouseDown (value) {
        return '    t.mouseDown('+ value +');';
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @returns {string} .
     */
    static mouseMove (x, y) {
        return '    t.mouseMove('+ x +', '+ y +');';
    }

    /**
     * @param {number} x .
     * @param {number} y .
     * @returns {string} .
     */
    static mouseMoveToEvent (x, y) {
        return '    t.mouseMoveToEvent('+ x +', '+ y +');';
    }

    /**
     * @param {string} text .
     * @returns {string} .
     */
    static typeText (text) {
        return '    t.typeText(\''+ text +'\');';
    }
}

module.exports = Util;
