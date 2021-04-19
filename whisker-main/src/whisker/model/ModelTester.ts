import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import Random from "../../util/random";
import {assert, assume} from "../../test-runner/assert";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";

export class ModelTester extends EventEmitter {

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private testDriver: TestDriver;

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString) {
        try {
            const result = new ModelLoaderXML().loadModels(modelsString);
            this.programModels = result.programModels;
            this.programModels.forEach(model => {
                model.on(LogMessage.MODEL_LOG, (message) => {
                    this.emit(LogMessage.MODEL_LOG, model, message);
                });
                model.on(LogMessage.MODEL_EDGE_TRACE, (edgeOutput) => {
                    this.emit(LogMessage.MODEL_EDGE_TRACE, edgeOutput);
                })
                model.on(LogMessage.MODEL_STOPPED, () => {
                    this.emit(LogMessage.MODEL_STOPPED, model);
                    this.emit(LogMessage.MODEL_STATE, this.testDriver.getSprites(undefined, false));
                })
            })
            this.userModels = result.userModels;
        } catch (e) {
            throw new Error("Model Loader: " + e.message);
        }
    }

    /**
     * Test a model on a project.
     */
    async test(vm, project, props, duration) {
        if (this.testDriver != undefined) {
            this.testDriver.clearCallbacks();
            this.testDriver.cancelRun();
        }

        if (typeof props === 'undefined' || props === null) {
            props = {extend: {}};
        } else if (!props.hasOwnProperty('extend')) {
            props.extend = {};
        }

        const results = [];
        this.emit(LogMessage.RUN_START);

        const util = new WhiskerUtil(vm, project);
        await util.prepare(props.accelerationFactor);

        // todo change functions, or not needed?
        this.testDriver = util.getTestDriver(
            {
                extend: {
                    assert: assert,
                    assume: assume,
                    log: message => {
                        this.log(message);
                    },
                    getCoverage: () => {
                        const coverage = props.CoverageGenerator.getCoverage();
                        return coverage.getCoverage();
                    },
                    ...props.extend
                }
            },);
        util.start();
        this.testDriver.seedScratch("Hallo?"); // ...

        let apple = this.testDriver.getSprite("Apple");
        apple.onMoved = () => {
            if (apple.isTouchingSprite("Bowl")) {
                let ms = Date.now();
                console.log("SCRATCH: Apple Sprite touched Bowl: " + ms)
            }
        }

        this.programModels.forEach(model => {
            model.reset();
        })

        this.testLabelsForErrors();
        this.setUpCallbacks();

        this.testDriver.detectRandomInputs({duration: [50, 100]});
        await this.testDriver.runForTime(duration);

        // todo what are the results, and update them
        this.emit(LogMessage.RUN_END, results);
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
                    model.emit(LogMessage.MODEL_STOPPED);
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

    /**
     * Log a message.
     */
    log(message) {
        this.emit(LogMessage.LOG, message);
    }
}

export enum LogMessage {
    LOG = "log",
    MODEL_LOG = "modelLog",
    MODEL_EDGE_TRACE = "modelEdgeTrace",
    RUN_CANCEL = "runCancel",
    MODEL_STOPPED = "modelStopped",
    MODEL_STATE = "modelState",
    RUN_END = "runEnd",
    RUN_START = "runStart",
}
