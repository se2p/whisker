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
import {CoverageResult, EndModel, ProgramModel,} from "./components/ProgramModel";
import {loadModels} from "./util/loadModels";
import {ModelJSON} from "./util/schema";
import {Checks} from "./util/Checks";
import {Check} from "./checks/newCheck";
import TestResult from "../../test-runner/test-result";
import Test from "../../test-runner/test";
import {Model} from "./components/AbstractModel";

type OracleModel = ProgramModel | EndModel;

export class ModelTester extends EventEmitter {

    private _nextTestDriver = null;
    private _nextUmIndex = ModelTester.NO_USER_MODEL;
    private _programModels: ProgramModel[] = [];
    private _userModels: UserModel[] = [];
    private _runningUserModel: UserModel = null;
    private _onTestEndModels: EndModel[] = [];

    private _checkUtility: CheckUtility | null;
    private _result: ModelResult | null;
    private _testDriver: TestDriver | null;

    public static readonly NO_USER_MODEL = -1;
    static readonly MODEL_LOAD_ERROR = "ModelLoadError";
    static readonly MODEL_LOG = "ModelLog";
    static readonly MODEL_WARNING = "ModelWarning";
    static readonly MODEL_LOG_COVERAGE = "ModelLogCoverage";
    static readonly MODEL_LOG_MISSED_EDGES = "ModelLogMissedEdges";
    static readonly MODEL_ON_LOAD = "ModelOnLoad";

    private _modelStepCallback: Callback | null;
    private _onTestEndCallback: Callback | null;
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
    }

    _load(modelsString: string, pModels: boolean, endModels: boolean, uModels: boolean): void {
        try {
            const {programModels, userModels, onTestEndModels} = loadModels(modelsString);
            if (pModels) {
                this._programModels = programModels;
            }
            if (endModels) {
                this._onTestEndModels = onTestEndModels;
            }
            if (uModels) {
                this._userModels = userModels;
            }
            this.emit(ModelTester.MODEL_ON_LOAD);
        } catch (e) {
            if (pModels) {
                this._programModels = [];
            }
            if (endModels) {
                this._onTestEndModels = [];
            }
            if (uModels) {
                this._userModels = [];
            }
            this.emit(ModelTester.MODEL_LOAD_ERROR, getErrorMessage(e));
            throw e;
        }
    }

    /**
     * Load the models from a json string
     * @param modelsString Models as a string coded in json.
     */
    load(modelsString: string): void {
        this._load(modelsString, true, true, true);
    }

    /**
     * Load the models from a json string
     * @param modelsString Models as a string coded in json.
     */
    loadUserModels(modelsString: string): void {
        this._load(modelsString, false, false, true);
    }

    /**
     * Load the models from a json string
     * @param modelsString Models as a string coded in json.
     */
    loadProgramModels(modelsString: string): void {
        this._load(modelsString, true, true, false);
    }

    /**
     * Whether any models are loaded at the moment.
     */
    someModelLoaded(): boolean {
        return this.programModelsLoaded() || this.userModelsLoaded();
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

    get userModelCount(): number {
        return this._userModels.length;
    }

    get canBeStopped(): boolean {
        return this._isRunning;
    }

    userModelIndices(): number[] {
        return this.userModelCount > 0 ? [...Array(this.userModelCount).keys()] : [ModelTester.NO_USER_MODEL];
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

    get nextTestDriver(): TestDriver {
        return this._nextTestDriver;
    }

    set nextTestDriver(value: TestDriver) {
        this._nextTestDriver = value;
    }

    set nextUmIndex(value: number) {
        this._nextUmIndex = value;
    }

    getAllModels(): ModelJSON[] {
        return [...this._programModels, ...this._userModels, ...this._onTestEndModels].map((m) => m.toJSON());
    }

    private prepareModel(t: TestDriver, umIndex = ModelTester.NO_USER_MODEL): void {
        if (!this.someModelLoaded()) {
            return;
        }
        if (!t) {
            throw new Error("No TestDriver provided.");
        }
        // logger.debug("----Preparing model----");
        this.emit(ModelTester.MODEL_LOG, "Preparing model...");
        this._testDriver = t;
        Container.testDriver = t;
        this._nextTestDriver = t;

        const allModels: Model[] = [...this._programModels, ...this._onTestEndModels];

        if (umIndex === ModelTester.NO_USER_MODEL) {
            this._runningUserModel = null;
        } else if (0 <= umIndex && umIndex < this.userModelCount && umIndex !== null) { // 0<=null<=0 evaluates to true
            this._runningUserModel = this._userModels[umIndex];
            allModels.push(this._runningUserModel);
            logger.debug(`start test with user model with id: ${this._runningUserModel.id}`);
        } else {
            throw new RangeError(`provided ${umIndex} as index for the UserModel which is neither valid nor ${ModelTester.NO_USER_MODEL}.`);
        }

        this._result = new ModelResult();
        this._checkUtility = new CheckUtility(t, allModels.length, this._result);
        this._checkUtility.on(CheckUtility.CHECK_UTILITY_EVENT, this._onVMEvent.bind(this));
        this._checkUtility.on(CheckUtility.CHECK_LOG_FAIL, this._onLogEvent.bind(this));

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        allModels.forEach(model => {
            model.reset();
            model.registerComponents(this._checkUtility!, t);
        });
        if (this._runningUserModel != null) {
            this._userInputGen();
        }

        this._modelStepCallback = this._addModelCallback(() => this._onModelStep(), true, "modelStep");
        this._onTestEndCallback = this._addModelCallback(() => this._onTestEnd(), true, "stopModelsCheck");

        if (this._programModels.length == 0) {
            this._modelStepCallback?.disable();
        }
        this._onTestEndCallback?.disable();
        this._isRunning = true;
    }

    /**
     * Prepare the model for a test run with the last selected UserModel and TestDriver.
     * Resets the models and adds the callbacks to the test driver.
     */
    prepareModelForNextRun(): void {
        this.prepareModel(this._nextTestDriver, this._nextUmIndex);
    }

    private _doOneStepOnOracleModel(model: OracleModel, notStoppedModels: OracleModel[]) {
        const takenEdge = model.makeOneTransition(this._testDriver!, this._checkUtility!);
        if (takenEdge instanceof ProgramModelEdge) {
            this._checkUtility!.registerEffectCheck(takenEdge, model);
            this._edgeTrace(takenEdge);
        }
        if (!model.stopped()) {
            notStoppedModels.push(model);
        }
    }

    private _doOracleModelStep(models: OracleModel[], fn: () => void): void {
        this._checkUtility!.makeFailedOutputs();
        const notStoppedModels: OracleModel[] = [];
        models.forEach((model: OracleModel) => this._doOneStepOnOracleModel(model, notStoppedModels));
        const contradictingEffects = this._checkUtility!.checkEffects();
        this._printContradictingEffects(contradictingEffects);
        if (notStoppedModels.length == 0 || models.some(m => m.haltAllModels())) {
            fn();
        }
    }

    private _onModelStep(): void {
        this._doOracleModelStep(this._programModels, () => this._startOnTestEnd());
    }

    private _startOnTestEnd() {
        this._modelStepCallback!.disable();

        if (this._onTestEndModels.length === 0) {
            return;
        }

        const steps = this._testDriver!.getTotalStepsExecuted() + 1;
        this._onTestEndModels.forEach(model => {
            model.setTransitionsStartTo(steps);
            model.programEndStep = steps;
        });
        if (this._runningUserModel) {
            this._runningUserModel.stepNbrOfProgramEnd = steps;
        }
        this._onTestEndCallback!.enable();
    }

    private _onTestEnd(): void {
        this._doOracleModelStep(this._onTestEndModels, () => this._onTestEndCallback!.disable());
    }

    private _userInputGen() {
        const userInputFun = async () => {
            const edge = this._runningUserModel.makeOneTransition(this._testDriver!, this._checkUtility!);
            if (edge instanceof UserModelEdge) {
                await edge.inputImmediate(this._testDriver!);
            }
            if (this._runningUserModel.stopped()) {
                callback.disable();
            }
        };
        const callback = this._addModelCallback(userInputFun, false, "inputOfUserModel");
    }

    private _addModelCallback(fun: () => void | Promise<void>, afterStep = false, name: string) {
        return this._testDriver!.vmWrapper.modelCallbacks.addCallback(fun, afterStep, name);
    }

    private _onVMEvent(checks: Checks) {
        if (!this._isRunning) {
            return;
        }

        // logger.debug(checks, this.testDriver.getTotalStepsExecuted());
        const inProgramModelStage = this._modelStepCallback!.isActive();
        const models = inProgramModelStage ? this._programModels : this._onTestEndModels;
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
        if (inProgramModelStage) {
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

    stopModels(result: TestResult, updateResultStatus = true): void {
        const res = this._stopAndGetModelResult();
        result.modelResult = res;
        if (res && updateResultStatus) {
            result.status = res.errors.length > 0 ? Test.ERROR : (res.fails.length === 0 ? Test.PASS : Test.FAIL);
        }
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    private _stopAndGetModelResult(): ModelResult | null {
        if (!this.someModelLoaded()) {
            return null;
        }
        if (this._isRunning) {
            this._isRunning = false;
            this._checkUtility!.stop();
            this._modelStepCallback!.disable();
            this._onTestEndCallback!.disable();
            if (this._testDriver.getTotalStepsExecuted() < 1) {
                // the test execution did not even start
                return null;
            }
            const models = [...this._programModels, ...this._onTestEndModels];
            models.forEach(model => {
                if (model.stopped()) {
                    // logger.debug(`Model '${model.id}' stopped.`);
                    this._result!.log.push("Model '" + model.id + "' stopped.");
                    this.emit(ModelTester.MODEL_LOG, "---Model '" + model.id + "' stopped.");
                }
            });
            const sprites = this._testDriver!.getSprites(() => true, false);
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
        }
        return this._result!;
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage(): Record<string, CoverageResult> {
        const coverage: Record<string, CoverageResult> = {};
        const programModels = [...this._programModels, ...this._onTestEndModels];
        const missedEdges: Record<string, string[]> = {};
        programModels.forEach(model => {
            const totalCov = model.getTotalCoverage();
            if (totalCov.missedEdges.length > 0) {
                missedEdges[model.id] = totalCov.missedEdges;
                logger.debug(`missed edges for model '${model.id}': ${totalCov.missedEdges}`);
            }
            coverage[model.id] = {covered: totalCov.covered, total: totalCov.total};
        });
        this.emit(ModelTester.MODEL_LOG_MISSED_EDGES, {missedEdges: missedEdges});
        return coverage;
    }

    private _printContradictingEffects(contradictingEffects: Check[]): void {
        if (contradictingEffects.length === 0) {
            return;
        }

        let output = "Model had to check contradicting effects! Skipping these.";
        contradictingEffects.forEach(effect => {
            output += "\n -- " + effect.toString();
        });
        logger.error("EFFECTS CONTRADICTING", output);
        this._result!.log.push("EFFECTS CONTRADICTING" + output);
        this.emit(ModelTester.MODEL_WARNING, output);
    }
}
