import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import {INITIAL_SEED} from "../../util/random";
import {assert, assume} from "../../test-runner/assert";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {ConditionState} from "./util/ConditionState";

export class ModelTester extends EventEmitter {

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private testDriver: TestDriver;
    private conditionState: ConditionState;

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
        this.emit(LogMessage.RUN_START);

        const results = [];
        for (let i = 0; i < 5; i++) {
            if (this.testDriver != undefined) {
                this.testDriver.clearCallbacks();
                this.testDriver.cancelRun();
            }

            if (typeof props === 'undefined' || props === null) {
                props = {extend: {}};
            } else if (!props.hasOwnProperty('extend')) {
                props.extend = {};
            }

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
            this.testDriver.seedScratch(INITIAL_SEED);

            this.programModels.forEach(model => {
                model.testDriver = this.testDriver;
                model.reset();
            })

            this.registerAndTestConditions();
            this.setUpCallbacks();

            // this.testDriver.detectRandomInputs({duration: [50, 100]});

            this.testDriver.addInputs([
                {"time":792,"input":{"device":"keyboard","key":"left arrow","isDown":true}},
                {"time":1054,"input":{"device":"keyboard","key":"left arrow","isDown":false}},
                {"time":2023,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":2522,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":2574,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":2622,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":2674,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":2683,"input":{"device":"keyboard","key":"right arrow","isDown":false}},
                {"time":3699,"input":{"device":"keyboard","key":"right arrow","isDown":true}},
                {"time":4013,"input":{"device":"keyboard","key":"right arrow","isDown":false}}
            ]);

            await this.testDriver.runForTime(duration);
            console.log("ended----------------")
            util.end();
        }
        // await this.testDriver.runForSteps(60);

        // todo what are the results, and update them
        this.emit(LogMessage.RUN_END, results);
        return results;
    }

    /**
     * Set up the callback that needs to be called around a Scratch step.
     */
    setUpCallbacks() {
        this.testDriver.addCallback(() => {
            // register models and callbacks
            this.programModels.forEach(model => {
                model.makeOneTransition();
            });

            // check whether a model stopped
            this.programModels.forEach(model => {
                if (model.stopped()) {
                    model.emit(LogMessage.MODEL_STOPPED);
                    model.testDriver.clearCallbacks();
                    // testDriver.cancelRun(); todo what to do when the model is already finished
                }
            });
            this.conditionState.resetConditionsThrown();
        }, true, "modelstep");
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @private
     */
    private registerAndTestConditions() {
        this.conditionState = new ConditionState(this.testDriver);
        this.programModels.forEach(model => {
            model.registerAndTestConditions(this.testDriver, this.conditionState);
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
