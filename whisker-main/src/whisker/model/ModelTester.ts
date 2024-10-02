import {ModelLoader, ModelType} from "./util/ModelLoader";
import {
    CoverageResult,
    ExtendedCoverageResult,
    ProgramModel,
    SimpleProgramModel
} from "./components/ProgramModel";
import {SimpleUserModel, UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import ModelResult from "../../test-runner/model-result";
import {ModelEdge, ProgramModelEdge, UserModelEdge} from "./components/ModelEdge";
import {Container} from "../utils/Container";
import {Callback} from "../../vm/callbacks";
import {Effect} from "./components/Effect";
import Sprite from "../../vm/sprite";
import logger from "../../util/logger";

export type SimpleTypedModel = SimpleTypedPModel | SimpleTypedUModel;

export interface SimpleTypedPModel extends SimpleProgramModel {
    usage: ModelType;
}

export interface SimpleTypedUModel extends SimpleUserModel {
    usage: ModelType;
}

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
    static readonly MODEL_LOG_MISSED_EDGES = "ModelLogMissedEdges";
    static readonly MODEL_ON_LOAD = "ModelOnLoad";

    private modelStepCallback: Callback;
    private onTestEndCallback: Callback;
    private haltAllCallback: Callback;
    private isRunning = false;

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString: string): void {
        try {
            const result = new ModelLoader().loadModels(modelsString);
            this.programModels = result.programModels;
            this.userModels = result.userModels;
            this.onTestEndModels = result.onTestEndModels;
            this.emit(ModelTester.MODEL_ON_LOAD);
        } catch (e) {
            this.programModels = [];
            this.userModels = [];
            this.onTestEndModels = [];
            this.emit(ModelTester.MODEL_LOAD_ERROR, e.message);
            throw e;
        }
    }

    /**
     * Whether any models are loaded at the moment.
     */
    someModelLoaded(): boolean {
        return this.programModels.length != 0 || this.userModels.length != 0;
    }

    /**
     * Check if program models are loaded.
     */
    programModelsLoaded(): boolean {
        return this.programModels.length != 0;
    }

    /**
     * Check if user models that represent the user behaviour are loaded.
     */
    userModelsLoaded(): boolean {
        return this.userModels.length != 0;
    }

    running(): boolean {
        return this.isRunning && (this.modelStepCallback.isActive() || this.onTestEndCallback.isActive());
    }

    getAllModels(): SimpleTypedModel[] {
        const models: SimpleTypedModel[] = [];
        this.programModels.forEach(model => {
            const shortened: SimpleProgramModel = model.simplifyForSave();
            models.push({usage: "program", ...shortened});
        });
        this.userModels.forEach(model => {
            const shortened: SimpleUserModel = model.simplifyForSave();
            models.push({usage: "user", ...shortened});
        });
        this.onTestEndModels.forEach(model => {
            const shortened: SimpleProgramModel = model.simplifyForSave();
            models.push({usage: "end", ...shortened});
        });
        return models;
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     * @param t Instance of the test driver for this test run.
     * @param caseSensitive Whether the names in the model should be checked with case sensitivity or not.
     */
    async prepareModel(t: TestDriver, caseSensitive: boolean): Promise<void> {
        // logger.debug("----Preparing model----");
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this.testDriver = t;
        Container.testDriver = t;

        const allModels = [...this.programModels, ...this.userModels, ...this.onTestEndModels];
        this.result = new ModelResult();
        this.checkUtility = new CheckUtility(t, allModels.length, this.result);
        this.checkUtility.on(CheckUtility.CHECK_UTILITY_EVENT, this.onVMEvent.bind(this));
        this.checkUtility.on(CheckUtility.CHECK_LOG_FAIL, this.onLogEvent.bind(this));

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        allModels.forEach(model => {
            model.reset();
            model.registerComponents(this.checkUtility, t, caseSensitive);
        });
        this.userInputGen();

        this.modelStepCallback = this.addModelCallback(this.getModelStepFunction(), true, "modelStep");
        this.onTestEndCallback = this.addModelCallback(this.getOnTestEndFunction(), true, "stopModelsCheck");
        this.haltAllCallback = this.addModelCallback(this.checkForHaltAll(), true, "checkForHalt");

        if (this.programModels.length == 0) {
            this.modelStepCallback.disable();
        }
        this.onTestEndCallback.disable();
        this.isRunning = true;
    }

    private doOneStepOnProgramModel(model:ProgramModel, notStoppedModels:ProgramModel[]){
        const takenEdge = model.makeOneTransition(this.testDriver, this.checkUtility);
        if (takenEdge != null && takenEdge instanceof ProgramModelEdge) {
            this.checkUtility.registerEffectCheck(takenEdge, model);
            this.edgeTrace(takenEdge);
        }
        if (!model.stopped()) {
            notStoppedModels.push(model);
        }
    }

    private getModelStepFunction() {
        let checkProgramModels = [...this.programModels];
        return () => {
            this.checkUtility.makeFailedOutputs();
            const notStoppedModels: ProgramModel[] = [];
            checkProgramModels.forEach(model => this.doOneStepOnProgramModel(model, notStoppedModels));
            const contradictingEffects = this.checkUtility.checkEffects();
            if (contradictingEffects && contradictingEffects.length != 0) {
                this.printContradictingEffects(contradictingEffects);
            }
            checkProgramModels = [...notStoppedModels];
            if (checkProgramModels.length == 0) {
                this.modelStepCallback.disable();
            }
        };
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
            });
        };
    }

    private startOnTestEnd() {
        this.modelStepCallback.disable();
        this.haltAllCallback.disable();
        if (this.onTestEndModels.length > 0) {
            const steps = this.testDriver.getTotalStepsExecuted() + 1;
            this.onTestEndModels.forEach(model => {
                model.setTransitionsStartTo(steps);
                model.programEndStep = steps;
            });
            this.userModels.forEach(model => {
                model.stepNbrOfProgramEnd = steps;
            });
            this.onTestEndCallback.enable();
        }
    }

    private getOnTestEndFunction() {
        let afterStopModels = [...this.onTestEndModels];
        return () => {
            this.checkUtility.makeFailedOutputs();
            const notStoppedModels: ProgramModel[] = [];
            afterStopModels.forEach(model => this.doOneStepOnProgramModel(model, notStoppedModels));
            const contradictingEffects = this.checkUtility.checkEffects();
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
            });
        };
    }

    private userInputGen() {
        if (this.userModelsLoaded()) {
            let userModels = [...this.userModels];
            const userInputFun = () => {
                const notStoppedUserModels: UserModel[] = [];
                userModels.forEach(model => {
                    const edge = model.makeOneTransition(this.testDriver, this.checkUtility);
                    if (edge != null && edge instanceof UserModelEdge) {
                        edge.inputImmediate(this.testDriver);
                    }
                    if (!model.stopped()) {
                        notStoppedUserModels.push(model);
                    }
                });
                userModels = notStoppedUserModels;
                if (userModels.length == 0) {
                    // logger.debug("Input generation per user models stopped.");
                    callback.disable();
                }
            };
            const callback = this.addModelCallback(userInputFun, false, "inputOfUserModel");
            return callback;
        }
    }

    private addModelCallback(fun: () => void, afterStep = false, name: string) {
        return this.testDriver.vmWrapper.modelCallbacks.addCallback(fun, afterStep, name);
    }

    private onVMEvent(eventStrings: string[]) {
        if (this.isRunning) {
            // logger.debug(eventStrings, this.testDriver.getTotalStepsExecuted());
            const models = this.modelStepCallback.isActive() ? this.programModels : this.onTestEndModels;

            for (let i = 0; i < models.length; i++) {
                if (!this.isRunning) {
                    return; //stop the complete testing if the run is ending
                }
                const model = models[i];
                const edge = model.testForEvent(this.testDriver, this.checkUtility, eventStrings);
                if (edge != null && edge instanceof ProgramModelEdge) {
                    this.checkUtility.registerEffectCheck(edge, model);
                    this.edgeTrace(edge);
                }
            }

            // check for halt if not yet stopped
            if (this.haltAllCallback.isActive()) {
                let halt = false;
                this.programModels.forEach(model => {
                    if (model.haltAllModels()) {
                        halt = true;
                    }
                });
                if (halt) {
                    this.checkUtility.checkEffects();
                    this.startOnTestEnd();
                    return;
                }
            }
            this.checkUtility.checkEventEffects();
        }
    }

    private onLogEvent(output) {
        this.emit(ModelTester.MODEL_LOG, output);
    }

    private edgeTrace(transition: ModelEdge) {
        const edgeID = transition.id;
        const conditions = transition.conditions;
        let edgeTrace = "'" + edgeID + "':";
        for (let i = 0; i < conditions.length; i++) {
            edgeTrace = edgeTrace + " [" + i + "] " + conditions[i].toString();
        }
        if (transition instanceof ProgramModelEdge) {
            if (transition.effects.length > 0) {
                edgeTrace = edgeTrace + " => ";
                for (let i = 0; i < transition.effects.length; i++) {
                    edgeTrace = edgeTrace + " [" + i + "] " + transition.effects[i].toString();
                }
            }
        }
        this.result.edgeTrace.push(edgeTrace);
        // for debugging...
        // this.emit(ModelTester.MODEL_LOG, "- Edge trace: " + edgeTrace);
        // if (transition.id.startsWith("points"))
        //     logger.debug("Edge trace: " + edgeTrace, this.testDriver.getTotalStepsExecuted());
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    stopAndGetModelResult(testDriver: TestDriver): ModelResult {
        this.isRunning = false;
        this.checkUtility.stop();
        this.modelStepCallback.disable();
        this.onTestEndCallback.disable();
        this.haltAllCallback.disable();
        const models = [...this.programModels, ...this.onTestEndModels];
        models.forEach(model => {
            if (model.stopped()) {
                // logger.debug("Model '" + model.id + "' stopped.");
                this.result.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.MODEL_LOG, "---Model '" + model.id + "' stopped.");
            }
        });
        const sprites = testDriver.getSprites(() => true, false);
        const log = [];
        log.push("--- State of variables:");

        sprites.forEach((sprite: Sprite) => {
            sprite.getVariables().forEach(variable => {
                const varOutput = sprite.name + "." + variable.name + " = " + variable.value;
                this.result.state.push(varOutput);
                log.push("--- " + varOutput);
            });
        });
        if (log.length > 1) {
            this.emit(ModelTester.MODEL_LOG, log.join("\n"));
        }

        const coverages = {covered: [], total: 0};

        const programModels = [...this.programModels, ...this.onTestEndModels];
        programModels.forEach(model => {
            const currentCov = model.getCoverageCurrentRun();
            coverages.covered.push(currentCov.covered);
            coverages.total += currentCov.total;
            this.result.coverage[model.id] = currentCov;
        });

        this.emit(ModelTester.MODEL_LOG_COVERAGE, [coverages]);
        // logger.debug("ModelResult", this.result, this.testDriver.getTotalStepsExecuted());
        return this.result;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage(): Record<string, CoverageResult> {
        const coverage: Record<string, CoverageResult> = {};
        const programModels: ProgramModel[] = [...this.programModels, ...this.onTestEndModels];
        const missedEdges: Record<string, string[]> = {};
        programModels.forEach(model => {
            const totalCov: ExtendedCoverageResult = model.getTotalCoverage();
            if (totalCov.missedEdges.length > 0) {
                missedEdges[model.id] = totalCov.missedEdges;
            }
            coverage[model.id] = {covered: totalCov.covered, total: totalCov.total};
        });
        this.emit(ModelTester.MODEL_LOG_MISSED_EDGES, {missedEdges: missedEdges});
        return coverage;
    }

    private printContradictingEffects(contradictingEffects: Effect[]): void {
        let output = "Model had to check contradicting effects! Skipping these.";
        contradictingEffects.forEach(effect => {
            output += "\n -- " + effect.toString();
        });
        logger.error("EFFECTS CONTRADICTING", output);
        this.result.log.push("EFFECTS CONTRADICTING" + output);
        this.emit(ModelTester.MODEL_WARNING, output);
    }
}
