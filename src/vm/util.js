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
     * @param {string} keyString .
     * @return {string} .
     */
    static getScratchKey (vm, keyString) {
        return vm.runtime.ioDevices.keyboard._keyStringToScratchKey(keyString);
    }
}

module.exports = Util;
