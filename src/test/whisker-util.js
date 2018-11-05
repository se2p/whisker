const VMWrapper = require('../vm/vm-wrapper');
const TestDriver = require('./test-driver');

class WhiskerUtil {
    constructor (vm, project, props) {

        /**
         * @type {VMWrapper}
         */
        this.vmWrapper = new VMWrapper(vm, props);

        /**
         * @type {string}
         */
        this.project = project;
    }

    /**
     * @returns {Promise<void>} .
     */
    async prepare () {
        return await this.vmWrapper.setup(this.project);
    }

    /**
     * @param {object=} props .
     * @returns {object} .
     */
    getTestDriver (props) {
        return new TestDriver(this.vmWrapper, props);
    }

    start () {
        this.vmWrapper.start();
    }

    end () {
        this.vmWrapper.end();
    }
}

module.exports = WhiskerUtil;
