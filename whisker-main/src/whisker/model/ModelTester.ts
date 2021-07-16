import {ModelLoader} from "./util/ModelLoader";
import {ProgramModel} from "./components/ProgramModel";
import {UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import ModelResult from "../../test-runner/model-result";
import {ProgramModelEdge, UserModelEdge} from "./components/ModelEdge";
import {Container} from "../utils/Container";
import {Callback} from "../../vm/callbacks"

export class ModelTester extends EventEmitter {

    private programModels: ProgramModel[] = [];
    private userModels: UserModel[] = [];
    private onTestEndModels: ProgramModel[] = [];

    private checkUtility: CheckUtility;
    private result: ModelResult;
    private testDriver: TestDriver;

    static readonly MODEL_LOAD_ERROR = "ModelLoadError";
    static readonly MODEL_LOG = "ModelLog";
    static readonly MODEL_WARNING = "ModelWarning";
    static readonly MODEL_LOG_COVERAGE = "ModelLogCoverage";
    static readonly MODEL_ON_LOAD = "ModelOnLoad";

    private modelStepCallback: Callback;
    private onTestEndCallback: Callback;
    private haltAllCallback: Callback;
    private checkLastFailedCallback: Callback;

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString) {
        try {
            const result = new ModelLoader().loadModels(modelsString);
            this.programModels = result.programModels;
            this.userModels = result.userModels;
            this.onTestEndModels = result.onTestEndModels;
            this.emit(ModelTester.MODEL_ON_LOAD);
        } catch (e) {
            this.emit(ModelTester.MODEL_LOAD_ERROR, e.message);
            throw e;
        }
    }

    /**
     * Whether any models are loaded at the moment.
     */
    someModelLoaded() {
        return this.programModels.length != 0 || this.userModels.length != 0;
    }

    /**
     * Check if program models are loaded.
     */
    programModelsLoaded() {
        return this.programModels.length != 0;
    }

    /**
     * Check if user models that represent the user behaviour are loaded.
     */
    userModelsLoaded() {
        return this.userModels.length != 0;
    }

    running() {
        return this.modelStepCallback.isActive() || this.onTestEndCallback.isActive() || this.checkLastFailedCallback.isActive();
    }

    getAllModels() {
        let models = [];
        this.programModels.forEach(model => {
            let shortened = model.simplifyForSave();
            models.push({usage: ModelLoader.PROGRAM_MODEL_ID, ...shortened});
        })
        this.userModels.forEach(model => {
            let shortened = model.simplifyForSave();
            models.push({usage: ModelLoader.USER_MODEL_ID, ...shortened});
        })
        this.onTestEndModels.forEach(model => {
            let shortened = model.simplifyForSave();
            models.push({usage: ModelLoader.ON_TEST_END_ID, ...shortened});
        })
        return models;
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     * @param t Instance of the test driver for this test run.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    async prepareModel(t: TestDriver, caseSensitive: boolean) {
        console.log("----Preparing model----");
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this.testDriver = t;
        Container.testDriver = t;

        let allModels = [...this.programModels, ...this.userModels, ...this.onTestEndModels];
        this.result = new ModelResult();
        this.checkUtility = new CheckUtility(t, allModels.length, this.result);
        this.checkUtility.on(CheckUtility.CHECK_UTILITY_EVENT, this.onEvent.bind(this));

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        allModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, t, this.result, caseSensitive);
        });
        this.userInputGen(this.result);

        this.modelStepCallback = this.addModelCallback(this.getModelStepFunction(), true, "modelStep");
        this.onTestEndCallback = this.addModelCallback(this.getOnTestEndFunction(), true, "stopModelsCheck");
        this.haltAllCallback = this.addModelCallback(this.checkForHaltAll(), true, "checkForHalt");
        this.checkLastFailedCallback = this.addModelCallback(() => {
            this.checkUtility.checkFailedEffects(this.result);
            this.checkLastFailedCallback.disable();
        }, true, "checkForFailedEffects")

        if (this.programModels.length == 0) {
            this.modelStepCallback.disable();
        }
        this.onTestEndCallback.disable();
        this.checkLastFailedCallback.disable();
    }

    private getModelStepFunction() {
        let checkProgramModels = [...this.programModels];
        return () => {
            this.checkUtility.checkFailedEffects(this.result);
            let notStoppedModels = [];
            checkProgramModels.forEach(model => {
                let takenEdge = model.makeOneTransition(this.testDriver, this.checkUtility, this.result);
                if (takenEdge != null && takenEdge instanceof ProgramModelEdge) {
                    this.checkUtility.registerEffectCheck(takenEdge, model);
                    this.edgeTrace(takenEdge);
                }
                if (!model.stopped()) {
                    notStoppedModels.push(model);
                }
            });
            let contradictingEffects = this.checkUtility.checkEffects(this.result);
            if (contradictingEffects && contradictingEffects.length != 0) {
                this.printContradictingEffects(contradictingEffects);
            }
            checkProgramModels = [...notStoppedModels];
            this.checkUtility.reset();

            if (checkProgramModels.length == 0) {
                this.modelStepCallback.disable();
            }
        }
    }

    private checkForHaltAll() {
        return () => {
            if (!this.modelStepCallback.isActive()) {
                this.startOnTestEnd();
                return;
            }

            this.programModels.forEach(model => {
                if (model.haltAllModels()) {
                    this.startOnTestEnd();
                }
            })
        }
    }

    private startOnTestEnd() {
        this.modelStepCallback.disable();
        this.haltAllCallback.disable();
        this.checkLastFailedCallback.enable();
        if (this.onTestEndModels.length > 0) {
            let steps = this.testDriver.getTotalStepsExecuted();
            this.onTestEndModels.forEach(model => {
                model.setTransitionsStartTo(steps);
                model.stepNbrOfProgramEnd = steps;
            })
            this.userModels.forEach(model => {
                model.stepNbrOfProgramEnd = steps;
            })
            this.onTestEndCallback.enable();
        }
    }

    private getOnTestEndFunction() {
        let afterStopModels = [...this.onTestEndModels];
        return () => {
            let notStoppedModels = [];
            afterStopModels.forEach(model => {
                let takenEdge = model.makeOneTransition(this.testDriver, this.checkUtility, this.result);
                if (takenEdge != null && takenEdge instanceof ProgramModelEdge) {
                    this.checkUtility.registerEffectCheck(takenEdge, model);
                    this.edgeTrace(takenEdge);
                }
                if (!model.stopped()) {
                    notStoppedModels.push(model);
                }
            })
            let contradictingEffects = this.checkUtility.checkEndEffects(this.result);
            if (contradictingEffects && contradictingEffects.length != 0) {
                this.printContradictingEffects(contradictingEffects);
            }
            if (notStoppedModels.length == 0) {
                this.onTestEndCallback.disable();
            }
            afterStopModels = [...notStoppedModels];

            afterStopModels.forEach(model => {
                if (model.haltAllModels()) {
                    this.onTestEndCallback.disable();
                    return;
                }
            })
        };
    }

    private userInputGen(modelResult: ModelResult) {
        if (this.userModelsLoaded()) {
            let userModels = [...this.userModels];
            let userInputFun = () => {
                let notStoppedUserModels = [];
                userModels.forEach(model => {
                    let edge = model.makeOneTransition(this.testDriver, this.checkUtility, modelResult);
                    if (edge != null && edge instanceof UserModelEdge) {
                        edge.inputImmediate(this.testDriver);
                    }
                    if (!model.stopped()) {
                        notStoppedUserModels.push(model);
                    }
                })
                userModels = notStoppedUserModels;
                if (userModels.length == 0) {
                    console.log("Input generation per user models stopped.");
                    callback.disable();
                }
            }
            let callback = this.addModelCallback(userInputFun, false, "inputOfUserModel");
            return callback;
        }
    }

    private addModelCallback(fun: Function, afterStep = false, name: string) {
        return this.testDriver.vmWrapper.modelCallbacks.addCallback(fun, afterStep, name);
    }

    private onEvent(eventStrings: string[]) {
        // console.log(eventStrings, this.testDriver.getTotalStepsExecuted());
        if (this.modelStepCallback.isActive()) {
            this.programModels.forEach(model => {
                let edge = model.testForEvent(this.testDriver, this.checkUtility, this.result, eventStrings);
                if (edge != null && edge instanceof ProgramModelEdge) {
                    // register only, check is after the step
                    this.checkUtility.registerEffectCheck(edge, model);
                    this.edgeTrace(edge);
                }
            });
        }
        if (this.onTestEndCallback.isActive()) {
            this.onTestEndModels.forEach(model => {
                let edge = model.testForEvent(this.testDriver, this.checkUtility, this.result, eventStrings);
                if (edge != null && edge instanceof ProgramModelEdge) {
                    // register only, check is after the step
                    this.checkUtility.registerEffectCheck(edge, model);
                    this.edgeTrace(edge);
                }
            });
        }
    }

    private edgeTrace(transition: ProgramModelEdge) {
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
        // if (transition.id.startsWith("bananas-"))
        //     console.log("Edge trace: " + edgeTrace, this.testDriver.getTotalStepsExecuted());
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    getModelStates(testDriver: TestDriver) {
        let models = [...this.programModels, ...this.onTestEndModels];
        models.forEach(model => {
            if (model.stopped()) {
                console.log("Model '" + model.id + "' stopped.");
                this.result.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.MODEL_LOG, "---Model '" + model.id + "' stopped.");
            }
        });
        const sprites = testDriver.getSprites(() => true, false);
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

        let programModels = [...this.programModels, ...this.onTestEndModels];
        programModels.forEach(model => {
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
        let programModels = [...this.programModels, ...this.onTestEndModels];
        programModels.forEach(model => {
            coverage[model.id] = model.getTotalCoverage();
        });
        return coverage;
    }

    private printContradictingEffects(contradictingEffects) {
        let output = "Model had to check contradicting effects! Skipping these.";
        contradictingEffects.forEach(effect => {
            output += "\n -- " + effect.toString();
        })
        console.error("EFFECTS CONTRADICTING", output);
        this.result.log.push("EFFECTS CONTRADICTING" + output);
        this.emit(ModelTester.MODEL_WARNING, output);
    }
}
