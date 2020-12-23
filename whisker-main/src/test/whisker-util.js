const VMWrapper = require('../vm/vm-wrapper');
const TestDriver = require('./test-driver');

class WhiskerUtil {
    constructor (vm, project) {

        /**
         * @type {VirtualMachine} .
         */
        this.vm = vm;

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = new VMWrapper(vm);

        /**
         * @type {string}
         */
        this.project = project;
    }

    async prepare (accelerationFactor) {
        await this.vmWrapper.setup(this.project, accelerationFactor);
    }

    /**
     * @param {object=} props .
     * @returns {object} .
     */
    getTestDriver (props) {
        return new TestDriver(this.vmWrapper, props);
    }

    /**
     * @returns {VMWrapper} .
     */
    getVMWrapper () {
        return this.vmWrapper;
    }

    start () {
        this.vmWrapper.start();
    }

    end () {
        this.vmWrapper.end();
    }
}

module.exports = WhiskerUtil;
