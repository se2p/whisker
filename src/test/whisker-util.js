const VMWrapper = require('../vm/vm-wrapper');
const TestDriver = require('./test-driver');
const Coverage = require('../vm/coverage');

class WhiskerUtil {
    constructor (vm, project, props) {

        /**
         * @type {object} .
         */
        this.props = props || {};

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

    async prepare () {
        await this.vmWrapper.setup(this.project);
        if (this.props.coverage) {
            if (this.props.Thread) {
                Coverage.prepareThread(this.props.Thread);
                Coverage.prepare(this.vm);
            } else {
                throw new Error('Need a reference to the VM\'s Thread class to gather coverage data.');
            }
        }
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
        if (this.props.coverage && !this.coverage) {
            Coverage.restoreThread(this.props.Thread);
            this.coverage = Coverage.getCoverage();
        }
    }

    getCoverage () {
        return this.coverage;
    }
}

module.exports = WhiskerUtil;
