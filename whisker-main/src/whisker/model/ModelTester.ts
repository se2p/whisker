import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import VMWrapper from "../../vm/vm-wrapper";
import Random from "../../util/random";

export class ModelTester {

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private vmWrapper: VMWrapper;

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    constructor(modelsString) {
        try {
            const result = new ModelLoaderXML().loadModels(modelsString);
            this.programModels = result.programModels;
            this.userModels = result.userModels;
        } catch (e) {
            throw new Error("Model Loader: " + e.message);
        }
    }

    /**
     * @param {VirtualMachine} vm .
     * @param {string} project .
     * @param {{extend: object}=} props .
     * @returns {Promise<Array>} .
     */
    async test(vm, project, props) {
        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!props.hasOwnProperty('extend')) {
            props.extend = {};
        }

        const results = [];
        // this.emit(TestRunner.RUN_START, model); todo change

        const util = new WhiskerUtil(vm, project);
        await util.prepare(props.accelerationFactor);
        this.vmWrapper = util.getVMWrapper();

        const testDriver = util.getTestDriver({});
        util.start();
        testDriver.seedScratch(Random.INITIAL_SEED);


        this.vmWrapper.start();
        this.programModels.forEach(model => {
            model.vmWrapper = this.vmWrapper;
            this.vmWrapper.callbacks.addCallback(function () {
                model.makeOneTransition();
            }, false, "modelstep");
        })

        this.vmWrapper.step();


        // this.emit(TestRunner.RUN_END, results);
        util.end();
        return results;
    }
}
