import {ModelLoaderXML} from "./util/ModelLoaderXML";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import {ModelResult} from "../../test-runner/test-result";
import {ProgramModelEdge, UserModelEdge} from "./components/ModelEdge";
import {Effect} from "./components/Effect";
import {Container} from "../utils/Container";

export class ModelTester extends EventEmitter {

    /**
     * For checking initialisation values for all sprites and constraints afterwards. Can also stay empty if
     * there are none.
     */
    private constraintsModels: ProgramModel[] = [];
    private programModels: ProgramModel[] = [];
    private userModels: UserModel[] = [];

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
            this.constraintsModels = result.constraintsModels;
            this.programModels = result.programModels;
            this.userModels = result.userModels;
        } catch (e) {
            this.emit(ModelTester.MODEL_LOAD_ERROR, "Model Loader: " + e.message);
            throw new Error("Model Loader: " + e.message);
        }
    }

    /**
     * Whether any models are loaded at the moment.
     */
    someModelLoaded() {
        return this.programModels.length != 0 || this.constraintsModels.length != 0 || this.userModels.length != 0;
    }

    /**
     * Check if program models are loaded.
     */
    programModelsLoaded() {
        return this.programModels.length != 0 && this.constraintsModels.length != 0;
    }

    /**
     * Check if user models that represent the user behaviour are loaded.
     */
    userModelsLoaded() {
        return this.userModels.length != 0;
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     * @param testDriver Instance of the test driver for this test run.
     */
    async prepareModel(testDriver: TestDriver) {
        console.log("----Preparing model----");
        Container.testDriver = testDriver;
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this.checkUtility = new CheckUtility(testDriver);
        this.result = new ModelResult();

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        this.programModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, testDriver, this.result);
        });
        this.constraintsModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, testDriver, this.result);
        });
        this.userModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, testDriver, this.result);
        })

        // There was already an error as conditions or effects could not be evaluated (e.g. missing sprites).
        if (this.result.errors.length > 0) {
            console.error("errors in conditions/effects before test run");
            return;
        }

        await this.addCallbacks(testDriver);
    }

    private async addCallbacks(testDriver: TestDriver) {
        let constraintCallback;
        let modelStepCallback;
        let modelStoppedCallback;
        let modelStopped = false;
        let endTimer = 1; // effects can be delayed one step
        this.userInputGen(testDriver, this.result);

        let beforeStepCallback = testDriver.addModelCallback(() => {
            this.checkUtility.testsBeforeStep();
        }, false, "testKeys");

        let constraintFunction = () => {
            this.constraintsModels.forEach(model => {
                if (model.stopped()) {
                    constraintCallback.disable(); // there are no more to check
                    return;
                }
            });
            this.constraintsModels.forEach(model => {
                let edge = model.makeOneTransition(testDriver, this.result);
                try {
                    if (edge != null && edge instanceof ProgramModelEdge) {
                        this.checkUtility.checkEffectsConstraint(edge, this.result);
                    }
                } catch (e) {
                    console.error(e);
                    constraintCallback.disable();
                    // modelStepCallback.disable();todo test
                    // modelStoppedCallback.disable();
                }
            })
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
                    if (takenEdge != null && takenEdge instanceof ProgramModelEdge) {
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
                if (this.constraintsModels.length > 0) {
                    constraintCallback.disable();
                }
            } else {
                this.checkUtility.checkFailedEffects(this.result);
                this.checkUtility.reset();
                endTimer--;
            }
        }

        // if there is a constraint model loaded add the callback
        if (this.constraintsModels.length > 0) {
            constraintCallback = testDriver.addModelCallback(constraintFunction, true, "constraints");
        }

        // run the test driver for one step as inputs can be in the first step but the vm does nothing yet.
        await testDriver.runForSteps(1);

        // if there is a program model loaded add the callbacks. There is either a program or constraint model!
        if (this.programModels.length > 0) {
            modelStepCallback = testDriver.addModelCallback(modelStepFunction, true, "modelStep");
            modelStoppedCallback = testDriver.addModelCallback(stoppedFunction, true, "modelStopped");
            modelStoppedCallback.disable(); // is started when models stop
        }
    }

    private userInputGen(t: TestDriver, modelResult: ModelResult) {
        if (this.userModelsLoaded()) {
            let userInputCallback;
            let userInputFun = () => {
                this.programModels.forEach(model => {
                    if (model.stopped()) {
                        userInputCallback.disable();
                        return;
                    }
                });
                this.userModels.forEach(model => {
                    let edge = model.makeOneTransition(t, modelResult);
                    if (edge != null && edge instanceof UserModelEdge) {
                        edge.inputImmediate(t);
                    }
                })
            }
            userInputCallback = t.addModelCallback(userInputFun, false, "inputOfUserModel");
        }
    }

    private edgeTrace(transition: ProgramModelEdge, testDriver: TestDriver) {
        let edgeID = transition.id;
        let conditions = transition.conditions;
        let edgeTrace = "'" + edgeID + "':";
        for (let i = 0; i < conditions.length; i++) {
            edgeTrace = edgeTrace + " [" + i + "] " + conditions[i].toString();
        }
        if (transition.effects.length > 0) {
            edgeTrace = edgeTrace + " => ";
            for (let i = 0; i < transition.effects.length; i++) {
                edgeTrace = edgeTrace + " [" + i + "] " + transition.effects[i].toString();
            }
        }
        this.result.edgeTrace.push(edgeTrace);
        this.emit(ModelTester.MODEL_LOG, "- Edge trace: " + edgeTrace);
        console.log("Edge trace: " + edgeTrace, testDriver.getTotalStepsExecuted());
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

        this.constraintsModels.forEach(model => {
            coverages[model.id] = model.getCoverageCurrentRun();
            this.result.coverage[model.id] = coverages[model.id];
        })
        this.programModels.forEach(model => {
            coverages[model.id] = model.getCoverageCurrentRun();
            this.result.coverage[model.id] = coverages[model.id];
        })

        this.emit(ModelTester.MODEL_LOG_COVERAGE, coverages);
        console.log(this.result);
        return this.result;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage() {
        const coverage = {};
        this.constraintsModels.forEach(model => {
            coverage[model.id] = model.getTotalCoverage();
        });
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
