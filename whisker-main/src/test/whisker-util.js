const VMWrapper = require('../vm/vm-wrapper');
const TestDriver = require('./test-driver');

/**
 * Utility functionality for whisker to access the {@link TestDriver} and {@link VMWrapper}.
 */
class WhiskerUtil {
    constructor (vm, project) {

        /**
         * @type {VirtualMachine} The currently used virtual machine.
         */
        this.vm = vm;

        /**
         * @type {VMWrapper} A wrapper for the virtual machine.
         */
        this.vmWrapper = new VMWrapper(vm, project);

        /**
         * @type {string} The project json.
         */
        this.project = project;
    }

    /**
     * Sets the acceleration factor in the {@link VMWrapper} that is used for testing the project.
     * @param {number} accelerationFactor The selected factor for acceleration.
     * @returns {Promise<void>} Promise that resolves after targets are installed.
     */
    async prepare (accelerationFactor) {
        await this.vmWrapper.setup(this.project, accelerationFactor);
    }

    /**
     * Gives back the {@link TestDriver} object.
     * @param {object=} props The given properties of the test driver.
     * @returns {TestDriver} The test driver object.
     */
    getTestDriver (props) {
        return new TestDriver(this.vmWrapper, props);
    }

    /**
     * Gives back the used {@link VMWrapper}.
     * @returns {VMWrapper} The wrapper for the vm.
     */
    getVMWrapper () {
        return this.vmWrapper;
    }

    /**
     * Starts the used {@link VMWrapper}.
     */
    start () {
        this.vmWrapper.start();
    }

    /**
     * Stops the currently running {@link VMWrapper}.
     */
    end () {
        this.vmWrapper.end();
    }
}

module.exports = WhiskerUtil;
