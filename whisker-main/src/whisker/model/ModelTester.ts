import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import WhiskerUtil from "../../test/whisker-util";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckListener} from "./util/CheckListener";
import {ModelResult} from "../../test-runner/test-result";
import {ModelEdge} from "./components/ModelEdge";

export class ModelTester extends EventEmitter {

    /**
     * For checking initialisation values for all sprites and constraints afterwards. Can also stay undefined if
     * there are none.
     * @private
     */
    private constraintsModel: ProgramModel;

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private checkListener: CheckListener;
    private result: ModelResult;

    private modelsStopped = false;

    static readonly LOAD_ERROR = "LoadError";
    static readonly LABEL_TEST_ERROR = "LabelTestError";
    static readonly LOG_MODEL = "LogModel";
    static readonly LOG_MODEL_COVERAGE: "LogModelCoverage";

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString) {
        try {
            const result = new ModelLoaderXML().loadModels(modelsString);
            this.constraintsModel = result.constraintsModel;
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
        } catch (e) {
            this.emit(ModelTester.LABEL_TEST_ERROR, e.message);
            throw e;
        }
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     */
    async prepareModel(testDriver: TestDriver) {
        console.log("----Preparing model----")
        this.emit(ModelTester.LOG_MODEL, "Preparing model...");
        this.modelsStopped = false;
        this.checkListener = new CheckListener(testDriver);
        this.result = new ModelResult();

        // reset the models
        this.programModels.forEach(model => {
            model.reset();
            model.registerCheckListener(this.checkListener);
        });
        let keyCallback = testDriver.addModelCallback(() => {
            this.checkListener.testKeys();
        }, false, "testKeys");

        // todo bug: when bowl hovers over bananas, step 305 bananas not touching red anymore -> bowl touching
        //  bananas thrown, although it is still on red...
        // run the test driver for one step as inputs can be in the first step but the vm does nothing yet.
        await testDriver.runForSteps(1);
        let endTimer = 3;
        let modelStopped = false;

        let constraintCallback
        if (this.constraintsModel) {
            constraintCallback = testDriver.addModelCallback(() => {
                this.constraintsModel.makeTransitions(testDriver, this.result);

                if (this.constraintsModel.stopped()) {
                    testDriver.removeModelCallback(constraintCallback); // there are no more to check
                }
            });
        }

        let modelStepCallback = testDriver.addModelCallback(() => {
            this.programModels.forEach(model => {
                this.edgeTrace(model.makeTransitions(testDriver, this.result), testDriver);
                model.checkEffects(testDriver, this.result);
            });

            if (modelStopped && endTimer == 0) {
                this.modelsStopped = true;
                testDriver.removeModelCallback(modelStepCallback);
                testDriver.removeModelCallback(keyCallback);
                if (this.constraintsModel) {
                    testDriver.removeModelCallback(constraintCallback);
                }
            } else if (modelStopped) {
                this.programModels.forEach(model => {
                    model.checkEffects(testDriver, this.result);
                })
                endTimer--;
            } else {
                this.programModels.forEach(model => {
                    if (model.stopped()) {
                        modelStopped = true;
                    }
                    // todo if it is the constraint model then stop all!
                })
            }

            this.checkListener.reset();
        }, true, "modelstep");
    }

    private edgeTrace(transitions: ModelEdge[], testDriver: TestDriver) {
        transitions.forEach(edge => {
            if (!edge.id.startsWith("bowl")) { // todo change this later on
                let edgeID = edge.id;
                let conditions = edge.conditions;
                let edgeTrace = "'" + edgeID + "':";
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
                this.emit(ModelTester.LOG_MODEL, "- Edge trace: " + edgeTrace);
                console.log("Edge trace: " + edgeTrace, testDriver.getTotalStepsExecuted());
            }
        });
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    getModelStates(testDriver: TestDriver) {
        this.programModels.forEach(model => {
            if (model.stopped()) {
                console.log("Model '" + model.id + "' stopped.");
                this.result.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.LOG_MODEL, "---Model '" + model.id + "' stopped.");
            }
        });
        const sprites = testDriver.getSprites(undefined, false);
        let log = [];
        log.push("--- State of variables:");
        sprites.forEach(sprite => {
            sprite.getVariables().forEach(variable => {
                let varOutput = sprite.name + "." + variable.name + " = " + variable.value;
                this.result.state.push(varOutput);
                log.push(varOutput);
            })
        })
        if (log.length > 1) {
            this.emit(ModelTester.LOG_MODEL, log.join("\n"));
        }
        this.emit(ModelTester.LOG_MODEL, "--- Model Coverage");
        let coverages = {};
        coverages["constraints"] = this.constraintsModel.getCoverageCurrentRun();
        this.programModels.forEach(model => {
            coverages[model.id] = model.getCoverageCurrentRun();
            this.result.coverage[model.id] = coverages[model.id];
        })
        this.emit(ModelTester.LOG_MODEL_COVERAGE, coverages);
        console.log(this.result)
        return this.result;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage() {
        let coverage = {};
        coverage["constraints"] = this.constraintsModel.getTotalCoverage();
        this.programModels.forEach(model => {
            coverage[model.id] = model.getTotalCoverage();
        })
        return coverage;
    }
}
