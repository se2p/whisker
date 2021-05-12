import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
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

    static readonly LOAD_ERROR = "LoadError";
    static readonly CONSTRAINT_FAILED = "ConstraintFailed";
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
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     */
    async prepareModel(testDriver: TestDriver) {
        console.log("----Preparing model----")
        this.emit(ModelTester.LOG_MODEL, "Preparing model...");
        this.checkListener = new CheckListener(testDriver);
        this.result = new ModelResult();

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        this.programModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkListener, testDriver, this.result);
        });
        this.constraintsModel.reset();
        this.constraintsModel.registerComponents(this.checkListener, testDriver, this.result);

        // There was already an error as conditions or effects could not be evaluated (e.g. missing sprites).
        if (this.result.error.length > 0) {
            console.error("errors in conditions/effects before test run");
            return;
        }

        await this.addCallbacks(testDriver);
    }

    // todo bug: when bowl hovers over bananas, step 305 bananas not touching red anymore -> bowl touching
    //  bananas thrown, although it is still on red...

    private async addCallbacks(testDriver: TestDriver) {
        let beforeStepCallback = testDriver.addModelCallback(() => {
            this.checkListener.testsBeforeStep();
        }, false, "testKeys");

        let constraintCallback;
        let modelStepCallback;
        let modelStoppedCallback;
        let modelStopped = false;
        let endTimer = 1; // effects can be delayed one step

        let constraintFunction = () => {
            try {
                this.constraintsModel.makeTransitions(testDriver, this.result);
            } catch (e) {
                constraintCallback.disable();
                modelStepCallback.disable();
                modelStoppedCallback.disable();
                this.emit(ModelTester.CONSTRAINT_FAILED, e.message + "\n Model stopped for this test!");
            }
            if (this.constraintsModel.stopped()) {
                constraintCallback.disable(); // there are no more to check
            }
        };
        let modelStepFunction = () => {
            this.programModels.forEach(model => {
                this.edgeTrace(model.makeTransitions(testDriver, this.result), testDriver);
                model.checkEffects(testDriver, this.result);
            });

            this.programModels.forEach(model => {
                if (model.stopped()) {
                    modelStopped = true;
                }
            });

            if (modelStopped) {
                modelStepCallback.disable();
                modelStoppedCallback.enable();
            }
            this.checkListener.reset();
        }
        let stoppedFunction = () => {
            if (endTimer == 0) {
                modelStoppedCallback.disable();
                beforeStepCallback.disable();
                if (this.constraintsModel) {
                    constraintCallback.disable();
                }
            } else {
                this.programModels.forEach(model => {
                    model.checkEffects(testDriver, this.result);
                })
                this.checkListener.reset();
                endTimer--;
            }
        }

        // the actual callbacks
        if (this.constraintsModel) {
            constraintCallback = testDriver.addModelCallback(constraintFunction, true, "constraints");
        }

        // run the test driver for one step as inputs can be in the first step but the vm does nothing yet.
        await testDriver.runForSteps(1);

        modelStepCallback = testDriver.addModelCallback(modelStepFunction, true, "modelStep");
        modelStoppedCallback = testDriver.addModelCallback(stoppedFunction, true, "modelStopped");
        modelStoppedCallback.disable(); // is started when models stop
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
