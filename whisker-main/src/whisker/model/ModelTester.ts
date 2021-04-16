import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import Random from "../../util/random";
import {assert, assume} from "../../test-runner/assert";
import TestDriver from "../../test/test-driver";

export class ModelTester {

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private testDriver: TestDriver;

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
     * Test a model on a project.
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

        // todo change functions, or not needed?
        this.testDriver = util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        console.log(message);
                    },
                    getCoverage: () => {
                        const coverage = props.CoverageGenerator.getCoverage();
                        return coverage.getCoverage();
                    },
                    ...props.extend
                }
            },);
        util.start();
        this.testDriver.seedScratch(Random.INITIAL_SEED);

        this.programModels.forEach(model => {
            model.reset();
        })

        this.testLabelsForErrors();
        this.setUpCallbacks();

        this.testDriver.detectRandomInputs({duration: [50, 100]});
        await this.testDriver.runForTime(3000);

        // this.emit(TestRunner.RUN_END, results);
        util.end();
        return results;
    }

    /**
     * Set up the callbacks that need to be called around a Scratch step.
     */
    setUpCallbacks() {
        // register models and callbacks
        this.programModels.forEach(model => {
            model.testDriver = this.testDriver;

            // add the model transition to the callbacks
            model.testDriver.addCallback(function () {
                model.makeOneTransition();
                if (model.stopped()) {
                    console.log("STOP");
                    model.testDriver.clearCallbacks();
                    // testDriver.cancelRun(); todo what to do when the model is already finished
                }
            }, true, "modelstep");
        })
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @private
     */
    private testLabelsForErrors() {
        this.programModels.forEach(model => {
            model.testLabelsForErrors(this.testDriver);
        })
    }
}
