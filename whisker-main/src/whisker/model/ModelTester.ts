import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import {ModelResult} from "../../test-runner/test-result";
import {ModelEdge} from "./components/ModelEdge";
import {Effect} from "./components/Effect";

export class ModelTester extends EventEmitter {

    /**
     * For checking initialisation values for all sprites and constraints afterwards. Can also stay undefined if
     * there are none.
     * @private
     */
    private constraintsModel: ProgramModel;

    private programModels: ProgramModel[];
    private userModels: UserModel[];

    private checkUtility: CheckUtility;
    private result: ModelResult;

    static readonly MODEL_LOAD_ERROR = "ModelLoadError";
    static readonly MODEL_LOG = "ModelLog";
    static readonly MODEL_WARNING = "ModelWarning";
    static readonly MODEL_LOG_COVERAGE = "ModelLogCoverage";

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
            this.emit(ModelTester.MODEL_LOAD_ERROR, "Model Loader: " + e.message);
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
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this.checkUtility = new CheckUtility(testDriver);
        this.result = new ModelResult();

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        this.programModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, testDriver, this.result);
        });
        if (this.constraintsModel) {
            this.constraintsModel.reset();
            this.constraintsModel.registerComponents(this.checkUtility, testDriver, this.result);
        }

        // There was already an error as conditions or effects could not be evaluated (e.g. missing sprites).
        if (this.result.errors.length > 0) {
            console.error("errors in conditions/effects before test run");
            return;
        }

        await this.addCallbacks(testDriver);
    }

    private async addCallbacks(testDriver: TestDriver) {
        let beforeStepCallback = testDriver.addModelCallback(() => {
            this.checkUtility.testsBeforeStep();
        }, false, "testKeys");

        let constraintCallback;
        let modelStepCallback;
        let modelStoppedCallback;
        let modelStopped = false;
        let endTimer = 1; // effects can be delayed one step

        let constraintFunction = () => {
            let edge = this.constraintsModel.makeOneTransition(testDriver, this.result);
            try {
                if (edge != null) {
                    this.checkUtility.checkEffectsConstraint(edge, this.result);
                }
            } catch (e) {
                console.error(e);
                constraintCallback.disable();
                modelStepCallback.disable();
                modelStoppedCallback.disable();
            }
            if (this.constraintsModel.stopped()) {
                constraintCallback.disable(); // there are no more to check
            }
        };
        let modelStepFunction = () => {
            this.programModels.forEach(model => {
                if (model.stopped()) {
                    modelStopped = true;
                }
            });

            if (modelStopped) {
                modelStepCallback.disable();
                modelStoppedCallback.enable();
            } else {
                this.checkUtility.checkFailedEffects(this.result);
                this.programModels.forEach(model => {
                    let takenEdge = model.makeOneTransition(testDriver, this.result);
                    if (takenEdge != null) {
                        this.checkUtility.registerEffectCheck(takenEdge);
                        this.edgeTrace(takenEdge, testDriver);
                    }
                });
                let contradictingEffects = this.checkUtility.checkEffects(this.result);
                if (contradictingEffects && contradictingEffects.length > 0) {
                    let output = this.contradictingEffectsOutput(contradictingEffects);
                    console.error("EFFECTS CONTRADICTING", output);
                    this.result.log.push("EFFECTS CONTRADICTING" + output);
                    this.emit(ModelTester.MODEL_WARNING, output);
                }
            }
            this.checkUtility.reset();
        }
        let stoppedFunction = () => {
            if (endTimer == 0) {
                modelStoppedCallback.disable();
                beforeStepCallback.disable();
                if (this.constraintsModel) {
                    constraintCallback.disable();
                }
            } else {
                this.checkUtility.checkFailedEffects(this.result);
                this.checkUtility.reset();
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

    private edgeTrace(transition: ModelEdge, testDriver: TestDriver) {
        // if (!transition.id.startsWith("bowl")) { // todo change this later on
        //     let edgeID = transition.id;
        //     let conditions = transition.conditions;
        //     let edgeTrace = "'" + edgeID + "':";
        //     for (let i = 0; i < conditions.length; i++) {
        //         edgeTrace = edgeTrace + " [" + i + "] " + conditions[i].toString();
        //     }
        //     if (transition.effects.length > 0) {
        //         edgeTrace = edgeTrace + " => ";
        //         for (let i = 0; i < transition.effects.length; i++) {
        //             edgeTrace = edgeTrace + " [" + i + "] " + transition.effects[i].toString();
        //         }
        //     }
        //     this.result.edgeTrace.push(edgeTrace); //todo
        //     this.emit(ModelTester.MODEL_LOG, "- Edge trace: " + edgeTrace);
        //     console.log("Edge trace: " + edgeTrace, testDriver.getTotalStepsExecuted());
        // }
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    getModelStates(testDriver: TestDriver) {
        this.programModels.forEach(model => {
            if (model.stopped()) {
                console.log("Model '" + model.id + "' stopped.");
                this.result.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.MODEL_LOG, "---Model '" + model.id + "' stopped.");
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
            this.emit(ModelTester.MODEL_LOG, log.join("\n"));
        }

        this.emit(ModelTester.MODEL_LOG, "--- Model Coverage");
        let coverages = {};

        if (this.constraintsModel) {
            coverages["constraints"] = this.constraintsModel.getCoverageCurrentRun();
        }
        this.programModels.forEach(model => {
            coverages[model.id] = model.getCoverageCurrentRun();
            this.result.coverage[model.id] = coverages[model.id];
        })

        this.emit(ModelTester.MODEL_LOG_COVERAGE, coverages);
        console.log(this.result)
        return this.result;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage() {
        const coverage = {};
        if (this.constraintsModel) {
            coverage[this.constraintsModel.id] = this.constraintsModel.getTotalCoverage();
        }
        this.programModels.forEach(model => {
            coverage[model.id] = model.getTotalCoverage();
        })
        return coverage;
    }

    private contradictingEffectsOutput(contradictingEffects: Effect[]): string {
        let output = "Model had to check contradicting effects! Skipping these.";
        contradictingEffects.forEach(effect => {
            output += "\n -- " + effect.toString();
        })
        return output;
    }
}
