import {UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import ModelResult from "../../test-runner/model-result";
import {AbstractEdge} from "./components/AbstractEdge";
import {Container} from "../utils/Container";
import {Callback} from "../../vm/callbacks";
import Sprite from "../../vm/sprite";
import logger from "../../util/logger";
import {getErrorMessage} from "./util/ModelError";
import {UserModelEdge} from "./components/UserModelEdge";
import {ProgramModelEdge} from "./components/ProgramModelEdge";
import {CoverageResult, EndModel, ExtendedCoverageResult, ProgramModel,} from "./components/ProgramModel";
import {loadModels} from "./util/loadModels";
import {ModelJSON} from "./util/schema";
import {Checks} from "./util/Checks";
import {Check} from "./checks/newCheck";

export class ModelTester extends EventEmitter {

    private _programModels: ProgramModel[] = [];
    private _userModels: UserModel[] = [];
    private _onTestEndModels: EndModel[] = [];

    private _checkUtility: CheckUtility | null;
    private _result: ModelResult | null;
    private _testDriver: TestDriver | null;

    static readonly MODEL_LOAD_ERROR = "ModelLoadError";
    static readonly MODEL_LOG = "ModelLog";
    static readonly MODEL_WARNING = "ModelWarning";
    static readonly MODEL_LOG_COVERAGE = "ModelLogCoverage";
    static readonly MODEL_LOG_MISSED_EDGES = "ModelLogMissedEdges";
    static readonly MODEL_ON_LOAD = "ModelOnLoad";

    private _modelStepCallback: Callback | null;
    private _onTestEndCallback: Callback | null;
    private _haltAllCallback: Callback | null;
    private _isRunning = false;

    constructor() {
        // FIXME: The code from prepareModel() should be moved here. Then, the prepareModel() method should be deleted,
        //  and the constructor be invoked instead. Then, we can stop (ab)using the non-null assertion operator `!`
        //  entirely in this file. However, restructuring initComponents() in index.js of whisker-web is curretnly a
        //  blocking issue for this.

        super();
        this._checkUtility = null;
        this._result = null;
        this._testDriver = null;

        this._modelStepCallback = null;
        this._onTestEndCallback = null;
        this._haltAllCallback = null;
    }

    /**
     * Load the models from a xml string. See ModelLoaderXML for more info.
     * @param modelsString Models as a string coded in xml.
     */
    load(modelsString: string): void {
        try {
            const result = loadModels(modelsString);
            this._programModels = result.programModels;
            this._userModels = result.userModels;
            this._onTestEndModels = result.onTestEndModels;
            this.emit(ModelTester.MODEL_ON_LOAD);
        } catch (e) {
            this._programModels = [];
            this._userModels = [];
            this._onTestEndModels = [];
            this.emit(ModelTester.MODEL_LOAD_ERROR, getErrorMessage(e));
            throw e;
        }
    }

    /**
     * Whether any models are loaded at the moment.
     */
    someModelLoaded(): boolean {
        return this._programModels.length > 0 || this._userModels.length > 0;
    }

    /**
     * Check if program models are loaded.
     */
    programModelsLoaded(): boolean {
        return this._programModels.length > 0;
    }

    /**
     * Check if user models that represent the user behaviour are loaded.
     */
    userModelsLoaded(): boolean {
        return this._userModels.length > 0;
    }

    running(): boolean {
        if (!this._isRunning) {
            return false;
        }

        let result = false;
        if (this._modelStepCallback !== null) {
            result = this._modelStepCallback.isActive();
        }

        if (!result && this._onTestEndCallback !== null) {
            result = this._onTestEndCallback.isActive();
        }

        return result;
    }

    getAllModels(): ModelJSON[] {
        return [
            this._programModels,
            this._userModels,
            this._onTestEndModels,
        ].flatMap((models) => models.map((m) => m.toJSON()));
    }

    /**
     * Prepare the model before a test run. Resets the models and adds the callbacks to the test driver.
     * @param t Instance of the test driver for this test run.
     */
    async prepareModel(t: TestDriver): Promise<void> {
        // logger.debug("----Preparing model----");
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this._testDriver = t;
        Container.testDriver = t;

        const allModels = [...this._programModels, ...this._userModels, ...this._onTestEndModels];
        this._result = new ModelResult();
        this._checkUtility = new CheckUtility(t, allModels.length, this._result);
        this._checkUtility.on(CheckUtility.CHECK_UTILITY_EVENT, this._onVMEvent.bind(this));
        this._checkUtility.on(CheckUtility.CHECK_LOG_FAIL, this._onLogEvent.bind(this));

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        allModels.forEach(model => {
            model.reset();
            model.registerComponents(this._checkUtility!, t);
        });
        this._userInputGen();

        this._modelStepCallback = this._addModelCallback(this._getModelStepFunction(), true, "modelStep");
        this._onTestEndCallback = this._addModelCallback(this._getOnTestEndFunction(), true, "stopModelsCheck");
        this._haltAllCallback = this._addModelCallback(this._checkForHaltAll(), true, "checkForHalt");

        if (this._programModels.length == 0) {
            this._modelStepCallback?.disable();
        }
        this._onTestEndCallback?.disable();
        this._isRunning = true;
    }

    private _doOneStepOnProgramModel(model: ProgramModel | EndModel, notStoppedModels: (ProgramModel | EndModel)[]) {
        const takenEdge = model.makeOneTransition(this._testDriver!, this._checkUtility!);
        if (takenEdge instanceof ProgramModelEdge) {
            this._checkUtility!.registerEffectCheck(takenEdge, model);
            this._edgeTrace(takenEdge);
        }
        if (!model.stopped()) {
            notStoppedModels.push(model);
        }
    }

    private _getModelStepFunction() {
        let checkProgramModels = [...this._programModels];
        return () => {
            this._checkUtility!.makeFailedOutputs();
            const notStoppedModels: ProgramModel[] = [];
            checkProgramModels.forEach(model => this._doOneStepOnProgramModel(model, notStoppedModels));
            const contradictingEffects = this._checkUtility!.checkEffects();
            if (contradictingEffects && contradictingEffects.length > 0) {
                this._printContradictingEffects(contradictingEffects);
            }
            checkProgramModels = [...notStoppedModels];
            if (checkProgramModels.length == 0) {
                this._modelStepCallback!.disable();
            }
        };
    }

    private _checkForHaltAll() {
        return () => {
            if (!this._modelStepCallback!.isActive()) {
                this._startOnTestEnd();
                return;
            }
            this._programModels.forEach(model => {
                if (model.haltAllModels()) {
                    this._startOnTestEnd();
                }
            });
        };
    }

    private _startOnTestEnd() {
        this._modelStepCallback!.disable();
        this._haltAllCallback!.disable();

        if (this._onTestEndModels.length <= 0) {
            return;
        }

        const steps = this._testDriver!.getTotalStepsExecuted() + 1;
        this._onTestEndModels.forEach(model => {
            model.setTransitionsStartTo(steps);
            model.programEndStep = steps;
        });
        this._userModels.forEach(model => {
            model.stepNbrOfProgramEnd = steps;
        });
        this._onTestEndCallback!.enable();
    }

    private _getOnTestEndFunction() {
        let afterStopModels = [...this._onTestEndModels];
        return () => {
            this._checkUtility!.makeFailedOutputs();
            const notStoppedModels: EndModel[] = [];
            afterStopModels.forEach(model => this._doOneStepOnProgramModel(model, notStoppedModels));
            const contradictingEffects = this._checkUtility!.checkEffects();
            if (contradictingEffects && contradictingEffects.length > 0) {
                this._printContradictingEffects(contradictingEffects);
            }
            if (notStoppedModels.length == 0) {
                this._onTestEndCallback!.disable();
            }
            afterStopModels = [...notStoppedModels];

            afterStopModels.forEach(model => {
                if (model.haltAllModels()) {
                    this._onTestEndCallback!.disable();
                    return;
                }
            });
        };
    }

    private _userInputGen() {
        if (!this.userModelsLoaded()) {
            return;
        }

        let userModels = [...this._userModels];
        const userInputFun = () => {
            const notStoppedUserModels: UserModel[] = [];
            userModels.forEach(model => {
                const edge = model.makeOneTransition(this._testDriver!, this._checkUtility!);
                if (edge instanceof UserModelEdge) {
                    edge.inputImmediate(this._testDriver!);
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
        const callback = this._addModelCallback(userInputFun, false, "inputOfUserModel");
        return callback;
    }

    private _addModelCallback(fun: () => void, afterStep = false, name: string) {
        return this._testDriver!.vmWrapper.modelCallbacks.addCallback(fun, afterStep, name);
    }

    private _onVMEvent(checks: Checks) {
        if (!this._isRunning) {
            return;
        }

        // logger.debug(checks, this.testDriver.getTotalStepsExecuted());
        const models = this._modelStepCallback!.isActive() ? this._programModels : this._onTestEndModels;
        for (const m of models) {
            if (!this._isRunning) {
                return; //stop the complete testing if the run is ending
            }
            const edge = m.testForEvent(this._testDriver!, this._checkUtility!, checks);
            if (edge instanceof ProgramModelEdge) {
                this._checkUtility!.registerEffectCheck(edge, m);
                this._edgeTrace(edge);
            }
        }

        // check for halt if not yet stopped
        if (this._haltAllCallback!.isActive()) {
            let halt = false;
            this._programModels.forEach(model => {
                if (model.haltAllModels()) {
                    halt = true;
                }
            });
            if (halt) {
                this._checkUtility!.checkEffects();
                this._startOnTestEnd();
                return;
            }
        }
        this._checkUtility!.checkEventEffects();
    }

    private _onLogEvent(output: unknown) {
        this.emit(ModelTester.MODEL_LOG, output);
    }

    private _edgeTrace(transition: AbstractEdge) {
        const edgeID = transition.id;
        const conditions = transition.conditions;
        let edgeTrace = "'" + edgeID + "':";
        for (let i = 0; i < conditions.length; i++) {
            edgeTrace = edgeTrace + " [" + i + "] " + conditions[i].toString();
        }
        if (transition instanceof ProgramModelEdge && transition.effects.length > 0) {
            edgeTrace = edgeTrace + " => ";
            for (let i = 0; i < transition.effects.length; i++) {
                edgeTrace = edgeTrace + " [" + i + "] " + transition.effects[i].toString();
            }
        }
        this._result!.edgeTrace.push(edgeTrace);
        // for debugging...
        // this.emit(ModelTester.MODEL_LOG, "- Edge trace: " + edgeTrace);
        // if (transition.id.startsWith("points"))
        //     logger.debug("Edge trace: " + edgeTrace, this.testDriver.getTotalStepsExecuted());
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    stopAndGetModelResult(testDriver: TestDriver): ModelResult {
        this._isRunning = false;
        this._checkUtility!.stop();
        this._modelStepCallback!.disable();
        this._onTestEndCallback!.disable();
        this._haltAllCallback!.disable();
        const models = [...this._programModels, ...this._onTestEndModels];
        models.forEach(model => {
            if (model.stopped()) {
                // logger.debug("Model '" + model.id + "' stopped.");
                this._result!.log.push("Model '" + model.id + "' stopped.");
                this.emit(ModelTester.MODEL_LOG, "---Model '" + model.id + "' stopped.");
            }
        });
        const sprites = testDriver.getSprites(() => true, false);
        const log = [];
        log.push("--- State of variables:");

        sprites.forEach((sprite: Sprite) => {
            sprite.getVariables().forEach(variable => {
                const varOutput = sprite.name + "." + variable.name + " = " + variable.value;
                this._result!.state.push(varOutput);
                log.push("--- " + varOutput);
            });
        });
        if (log.length > 1) {
            this.emit(ModelTester.MODEL_LOG, log.join("\n"));
        }

        const coverages = {covered: [] as string[][], total: 0};

        const programModels = [...this._programModels, ...this._onTestEndModels];
        programModels.forEach(model => {
            const currentCov = model.getCoverageCurrentRun();
            coverages.covered.push(currentCov.covered);
            coverages.total += currentCov.total;
            this._result!.coverage[model.id] = currentCov;
        });

        this.emit(ModelTester.MODEL_LOG_COVERAGE, [coverages]);
        // logger.debug("ModelResult", this.result, this.testDriver.getTotalStepsExecuted());
        return this._result!;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage(): Record<string, CoverageResult> {
        const coverage: Record<string, CoverageResult> = {};
        const programModels: (ProgramModel | EndModel)[] = [...this._programModels, ...this._onTestEndModels];
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

    private _printContradictingEffects(contradictingEffects: Check[]): void {
        let output = "Model had to check contradicting effects! Skipping these.";
        contradictingEffects.forEach(effect => {
            output += "\n -- " + effect.toString();
        });
        logger.error("EFFECTS CONTRADICTING", output);
        this._result!.log.push("EFFECTS CONTRADICTING" + output);
        this.emit(ModelTester.MODEL_WARNING, output);
    }
}
