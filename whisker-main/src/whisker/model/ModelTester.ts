import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {ConditionState} from "./util/ConditionState";
import {ModelResult} from "../../test-runner/test-result";
import {ModelEdge} from "./components/ModelEdge";

export class ModelTester extends EventEmitter {

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private conditionState: ConditionState;
    private result: ModelResult;

    private modelsStopped = false;

    static readonly LOAD_ERROR = "LoadError";
    static readonly LABEL_TEST_ERROR = "LabelTestError";

    static readonly LOG_MODEL_STOPPED = "LogModelStopped";
    static readonly LOG_MODEL = "LogModel";
    static readonly LOG_EDGE_TRACE = "LogEdgeTrace";

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString) {
        try {
            const result = new ModelLoaderXML().loadModels(modelsString);
            this.programModels = result.programModels;
            this.userModels = result.userModels;
        } catch (e) {
            this.emit(ModelTester.LOAD_ERROR, "Model Loader: " + e.message);
            throw new Error("Model Loader: " + e.message);
        }
    }

    /**
     * Check if program models are loaded.
     */
    programModelsDefined() {
        return this.programModels != undefined;
    }

    /**
     * Check if user models that represent the user behaviour are loaded.
     */
    userModelsDefined() {
        return this.userModels != undefined;
    }

    /**
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @private
     */
    async testModels(vm, project) {
        const util = new WhiskerUtil(vm, project);
        await util.prepare(1);

        const testDriver = util.getTestDriver({extend: {}});
        try {
            this.programModels.forEach(model => {
                model.testModel(testDriver);
            })
        } catch (e) { // TODO what happens with the thrown error?
            this.emit(ModelTester.LABEL_TEST_ERROR, e);
            throw e;
        }
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     */
    prepareModel(testDriver: TestDriver) {
        console.log("----Reseting model----")
        this.modelsStopped = false;
        this.conditionState = new ConditionState(testDriver);
        this.result = new ModelResult();

        // reset the models
        this.programModels.forEach(model => {
            model.reset();
            model.registerConditionState(this.conditionState);
        });
        testDriver.addModelCallback(() => {
            this.conditionState.testKeys();
        }, false, "testKeys");

        let endTimer = 3;
        testDriver.addModelCallback(() => {
            this.programModels.forEach(model => {
                this.edgeTrace(model.makeTransitions(testDriver, this.result), testDriver);
                try {
                    model.checkEffects(testDriver, this.result);
                } catch (e) {
                    console.error(e.message, testDriver.getTotalStepsExecuted());
                    this.result.error.push(e);
                }
            });

            // after all transitions in the same step look up if they are finished
            let stopped = false;
            this.programModels.forEach(model => {
                if (model.stopped()) {
                    stopped = true;
                }
            })

            if (stopped) {
                this.programModels.forEach(model => {
                    try {
                        model.checkEffects(testDriver, this.result);
                    } catch (e) {
                        console.error(e.message, testDriver.getTotalStepsExecuted());
                        this.result.error.push(e);
                    }
                })

                if (endTimer == 0) {
                    this.modelsStopped = true;
                }
                endTimer--;
            }

            this.conditionState.resetConditionsThrown();
        }, true, "modelstep");
    }

    /**
     * Test the model for a given maximal duration or until the program stops.
     * @param testDriver Instance of the test driver.
     * @param duration Maximal duration. If undefined the test runs until the program stops.
     */
    async test(testDriver: TestDriver, duration: number) {
        // Start the test run with either a maximal duration or until the program stops
        await testDriver.runForSteps(1);
        await testDriver.runUntil(() => {
            return !testDriver.isProjectRunning() || this.modelsStopped;
        }, duration);

        this.getModelStates(testDriver);
        console.log("one run ended----------------")
        return this.result;
    }

    private edgeTrace(transitions: ModelEdge[], testDriver: TestDriver) {
        transitions.forEach(edge => {
            if (!edge.id.startsWith("bowl")) { // todo change this later on
                let edgeID = edge.id;
                let conditions = edge.conditions;
                let edgeTrace = "Edge '" + edgeID + "':";
                for (let i = 0; i < conditions.length; i++) {
                    edgeTrace = edgeTrace + " [" + i + "] " + conditions[i].toString();
                }
                if (edge.effects.length > 0) {
                    edgeTrace = edgeTrace + " => ";
                    for (let i = 0; i < edge.effects.length; i++) {
                        edgeTrace = edgeTrace + " [" + i + "] " + edge.effects[i].toString();
                    }
                }
                this.result.edgeTrace.push(edgeTrace); //todo
                this.emit(ModelTester.LOG_EDGE_TRACE, edgeTrace);
                console.log("TRACE: " + edgeTrace, testDriver.getTotalStepsExecuted());
            }
        });
    }

    private getModelStates(testDriver: TestDriver) {
        this.programModels.forEach(model => {
            if (model.stopped()) {
                console.log("Model '" + model.id + "' stopped.");
                this.result.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.LOG_MODEL_STOPPED, model.id);
            }
        });
        const sprites = testDriver.getSprites();
        sprites.forEach(sprite => {
            sprite.getVariables().forEach(variable => {
                this.result.state.push(sprite.name + "." + variable.name + " = " + variable.value);
            })
        })
        console.log(this.result)
    }
}
