import {UserModel} from "./components/UserModel";
import TestDriver from "../../test/test-driver";
import {EventEmitter} from "events";
import {CheckUtility} from "./util/CheckUtility";
import {ModelResult} from "../../test-runner/model-result";
import {Container} from "../utils/Container";
import {Callback} from "../../vm/callbacks";
import Sprite from "../../vm/sprite";
import logger from "../../util/logger";
import {getErrorMessage} from "./util/ModelError";
import {CoverageResult, EndModel, MinimizationResult, ProgramModel,} from "./components/ProgramModel";
import {loadModels} from "./util/loadModels";
import {ModelJSON} from "./util/schema";
import {Check} from "./checks/newCheck";
import TestResult from "../../test-runner/test-result";
import Test from "../../test-runner/test";
import {Model, OracleModel} from "./components/AbstractModel";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import {addModelToMap, clearAllModels, registerCloneCreatedEvent} from "./util/ModelUtil";

export class ModelTester extends EventEmitter {

    public static readonly NO_USER_MODEL = -1;
    static readonly MODEL_LOAD_ERROR = "ModelLoadError";
    static readonly MODEL_LOG = "ModelLog";
    static readonly MODEL_WARNING = "ModelWarning";
    static readonly MODEL_LOG_COVERAGE = "ModelLogCoverage";
    static readonly MODEL_LOG_MISSED_EDGES = "ModelLogMissedEdges";
    static readonly MODEL_ON_LOAD = "ModelOnLoad";
    public repetitions = 0;
    private _duration = 0;
    private _programModels: ProgramModel[] = [];
    private _cloneCreatedModels: ProgramModel[] = [];
    private _userModels: UserModel[] = [];
    private _runningUserModel: UserModel = null;
    private _onTestEndModels: EndModel[] = [];
    private _checkUtility: CheckUtility | null;
    private _result: ModelResult | null;
    private _testDriver: TestDriver | null;
    private _modelStepCallback: Callback | null;
    private _onTestEndCallback: Callback | null;
    private _isRunning = false;
    private _onTargetCreatedListener: (target: RenderedTarget) => void;
    private _nextTestDriver = null;
    private _nextUmIndex = ModelTester.NO_USER_MODEL;
    private _executionCount = 0;
    private _modelSummary: Record<string, TestResult[]> = {};
    private _modelTestResults: TestResult[] = [];
    private static readonly instance: ModelTester = new ModelTester();

    private constructor() {
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

    static getInstance(): ModelTester {
        return this.instance;
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

    get userModelCount(): number {
        return this._userModels.length;
    }

    get canBeStopped(): boolean {
        return this._isRunning;
    }

    get currentUserModelId(): string | null {
        return this._runningUserModel ? this._runningUserModel.id : null;
    }

    set duration(value: number) {
        this._duration = value;
    }

    get runIndex(): number {
        return this._executionCount;
    }

    get summary(): Record<string, TestResult[]> {
        return this._modelSummary;
    }

    _load(modelsString: string, pModels: boolean, endModels: boolean, uModels: boolean): void {
        try {
            const {programModels, userModels, onTestEndModels} = loadModels(modelsString);
            if (pModels) {
                this._programModels = [...programModels];
                this._cloneCreatedModels = this._programModels.filter(m => m.type === "CloneCreated");
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
                this._cloneCreatedModels = [];
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

    userModelIndices(): number[] {
        return this.userModelCount > 0 ? [...Array(this.userModelCount).keys()] : [ModelTester.NO_USER_MODEL];
    }

    running(): boolean {
        return this._isRunning && this._someCallbackActive();
    }

    getAllModels(): ModelJSON[] {
        return [...this._programModels, ...this._userModels, ...this._onTestEndModels].map((m) => m.toJSON());
    }

    /**
     * Prepare the model for a test run with the last selected UserModel and TestDriver.
     * Resets the models and adds the callbacks to the test driver.
     */
    prepareModelForNextRun(): void {
        this.prepareModel(this._nextTestDriver, this._nextUmIndex);
    }

    stopModels(result: TestResult, updateResultStatus = true, addToModelResults = true): void {
        const res = this._stopAndGetModelResult();
        if (!result) {
            this._log("No TestResult Found. Creating new one.");
            result = new TestResult(null);
        }
        result.modelResult = res;
        this._log("Adding Model results to result");
        if (res) {
            if (updateResultStatus) {
                result.status = res.errors.length > 0 ? Test.ERROR : (res.fails.length === 0 ? Test.PASS : Test.FAIL);
            }
            if (addToModelResults) {
                this._modelTestResults.push(result);
            }
        }
    }

    /**
     * Get the total coverage of the program models of all test runs.
     */
    getTotalCoverage(log = false): Record<string, CoverageResult> {
        const coverage: Record<string, CoverageResult> = {};
        const programModels = [...this._programModels, ...this._onTestEndModels];
        const missedEdges: Record<string, string[]> = {};
        programModels.forEach(model => {
            const totalCov = model.getTotalCoverage();
            if (totalCov.missedEdges.length > 0) {
                missedEdges[model.id] = totalCov.missedEdges;
                if (log) {
                    logger.debug(`missed edges for model '${model.id}': ${totalCov.missedEdges}`);
                }
            }
            coverage[model.id] = {covered: totalCov.covered, total: totalCov.total};
        });
        if (log) {
            this.emit(ModelTester.MODEL_LOG_MISSED_EDGES, {missedEdges: missedEdges});
        }
        return coverage;
    }

    clearRepetitionCoverage(): void {
        this._programModels.forEach(model => model.clearRepetitionCoverage());
        this._onTestEndModels.forEach(model => model.clearRepetitionCoverage());
    }

    clearCoverage(): void {
        this._executionCount = 0;
        this._programModels.forEach(model => model.clearTotalCoverage());
        this._onTestEndModels.forEach(model => model.clearTotalCoverage());
    }

    minimizeOracleModels(): MinimizationResult[] {
        return [
            ...this._programModels.map((m) => m.toMinimizedJSON()),
            ...this._onTestEndModels.map((m) => m.toMinimizedJSON())
        ];
    }

    clear(): void {
        this.clearCoverage();
        this._modelSummary = {};
        this._modelTestResults = [];
    }

    getDurationForUserModel(): number {
        return this._runningUserModel !== null && this._runningUserModel.hasMaxDuration
            ? Math.min(this._duration, this._runningUserModel.maxDuration)
            : this._duration;
    }

    updateSummaryForProject(projectName: string): TestResult[] {
        if (!this._modelSummary[projectName]) {
            this._modelSummary[projectName] = [...this._modelTestResults];
        } else if (this._modelTestResults?.length > 0) {
            this._modelSummary[projectName].push(...this._modelTestResults);
        }
        this._modelTestResults = [];
        return this._modelSummary[projectName];
    }

    clearCurrentModelResults(): void {
        this._modelTestResults = [];
    }

    private prepareModel(t: TestDriver, umIndex = ModelTester.NO_USER_MODEL): void {
        if (!this.someModelLoaded()) {
            return;
        }
        if (!t) {
            throw new Error("No TestDriver provided.");
        }
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
        const msg = this._runningUserModel
            ? `Preparing model for run with user model: ${this._runningUserModel.id}...`
            : "Preparing model for run...";
        this._log(msg);

        this._result = new ModelResult();
        this._result.testNbr = this._executionCount;
        this._checkUtility = new CheckUtility(t, allModels.length, this._result);
        this._checkUtility.on(CheckUtility.CHECK_UTILITY_EVENT, this._onVMEvent.bind(this));
        this._checkUtility.on(CheckUtility.CHECK_LOG_FAIL, this._onLogEvent.bind(this));

        // reset the models and register the new test driver and check listener. Log errors on edges in initialisation
        clearAllModels();
        this._programModels.forEach(addModelToMap);
        allModels.forEach(model => {
            model.reset();
            model.registerComponents(this._checkUtility!, t);
        });
        if (this._runningUserModel != null) {
            this._userInputGen();
        }

        this._modelStepCallback = this._addModelCallback(() => this._onModelStep(), true, "modelStep");
        this._onTestEndCallback = this._addModelCallback(() => this._onTestEnd(), true, "stopModelsCheck");
        this._onTargetCreatedListener = this._onTargetCreated.bind(this);
        this._testDriver.vm.runtime.on('targetWasCreated', this._onTargetCreatedListener);

        if (this._programModels.length == 0) {
            this._modelStepCallback?.disable();
        }
        this._onTestEndCallback?.disable();
        this._isRunning = true;
        this._log("Done preparing models");
    }

    private _doOneStepOnOracleModel(model: OracleModel): boolean {
        const result = model.makeOneTransition(this._testDriver!, this._checkUtility!);
        if (result) {
            const [takenEdge, steps] = result;
            this._checkUtility!.registerEffectCheck(takenEdge, steps, model.programEndStep);
        }
        return model.stopped();
    }

    private _doOracleModelStep(models: OracleModel[], fn: () => void): void {
        const allStopped = models
            // NOTE: Must be executed for every model! Cannot use every() directly, since it may terminate early.
            .map((model) => this._doOneStepOnOracleModel(model))
            .every((b) => b);
        const contradictingEffects = this._checkUtility!.checkEffects();
        this._printContradictingEffects(contradictingEffects);
        if (allStopped) {
            this._debug("All", models[0].usage, "models reached a stopping stage");
            fn();
        } else {
            this._checkStopAllNodeReached(models, fn);
        }
        this._checkUtility!.makeFailedOutputs();
    }

    private _checkStopAllNodeReached(models: OracleModel[], fn: () => void): void {
        const stoppingModels = models.filter(m => m.haltAllModels());
        if (stoppingModels.length > 0) {
            this._debug("The following", models[0].usage, "models reached a stop all node:",
                stoppingModels.map(m => m.id).join(", "));
            fn();
        }
    }

    private _onModelStep(): void {
        this._doOracleModelStep(this._programModels, () => this._startOnTestEnd());
    }

    private _startOnTestEnd() {
        this._modelStepCallback!.disable();

        if (this._onTestEndModels.length === 0) {
            this._debug("There are no end models to execute");
            return;
        }
        this._debug("Starting end models");

        const steps = this._testDriver!.getTotalStepsExecuted();
        this._onTestEndModels.forEach(model => {
            model.setTransitionsStartTo(steps);
            model.programEndStep = steps;
        });
        if (this._runningUserModel) {
            this._runningUserModel.programEndStep = steps;
        }
        this._onTestEndCallback!.enable();
    }

    private _log(...msg: string[]) {
        this.emit(ModelTester.MODEL_LOG, msg.join(" "));
    }

    private _debug(...msg: (string | number | boolean)[]): void {
        this.emit(ModelTester.MODEL_LOG, `Step ${this._testDriver.getTotalStepsExecuted()}: ${msg.join(" ")}`);
    }

    private _onTestEnd(): void {
        this._doOracleModelStep(this._onTestEndModels, () => this._onTestEndCallback!.disable());
    }

    private _userInputGen() {
        const userInputFun = async () => {
            const result = this._runningUserModel.makeOneTransition(this._testDriver!, this._checkUtility!);
            if (result !== null) {
                await result[0].inputImmediate(this._testDriver!);
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

    private _onVMEvent(modelIds: Set<string>) {
        if (!this._isRunning) {
            return;
        }
        const inProgramModelStage = this._modelStepCallback!.isActive();
        const models: OracleModel[] = inProgramModelStage ? this._programModels : this._onTestEndModels;
        models.filter(m => modelIds.has(m.id)).forEach((m: OracleModel) => m.testForEvent(this._testDriver!));
    }

    private _onLogEvent(output: string) {
        this._log(output);
    }

    private _someCallbackActive(): boolean {
        return this._modelStepCallback?.isActive() || this._onTestEndCallback?.isActive();
    }

    /**
     * Get the result of the test run as a ModelResult.
     */
    private _stopAndGetModelResult(): ModelResult | null {
        if (!this.someModelLoaded()) {
            return null;
        }
        if (!this._isRunning) {
            return this._result;
        }

        this._isRunning = false;
        this._checkUtility!.stop();
        this._modelStepCallback!.disable();
        this._onTestEndCallback!.disable();
        this._testDriver.vm.runtime.removeListener('targetWasCreated', this._onTargetCreatedListener);
        if (this._testDriver.getTotalStepsExecuted() < 1) {
            // the test execution did not even start
            return null;
        }
        const models = [...this._programModels, ...this._onTestEndModels];
        models.forEach(model => {
            if (model.stopped()) {
                this._log("---Model '" + model.id + "' stopped.");
            }
        });
        const sprites = this._testDriver!.getSprites(() => true, false);
        const log = [];
        log.push("--- State of variables:");

        sprites.forEach((sprite: Sprite) => {
            sprite.getVariables().forEach(variable => {
                const varOutput = sprite.name + "." + variable.name + " = " + variable.value;
                log.push("--- " + varOutput);
            });
        });
        if (log.length > 1) {
            this._log(log.join("\n"));
        }

        const coverages: { covered: number, total: number } = {covered: 0, total: 0};

        const programModels = [...this._programModels, ...this._onTestEndModels];
        programModels.forEach(model => {
            const currentCov = model.getCoverageCurrentRun();
            coverages.covered += currentCov.covered;
            coverages.total += currentCov.total;
            this._result!.coverage[model.id] = currentCov;
        });

        this.emit(ModelTester.MODEL_LOG_COVERAGE, coverages);
        ++this._executionCount;

        return this._result!;
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
        this.emit(ModelTester.MODEL_WARNING, output);
    }

    private _onTargetCreated(newTarget: RenderedTarget) {
        const spriteName = newTarget.getName();
        const step = this._testDriver.getTotalStepsExecuted();
        registerCloneCreatedEvent(spriteName, step);
        this._cloneCreatedModels.filter(m => m.param === spriteName).forEach(model => {
            if (model.stopped()) {
                model.restart(step);
                model.registerComponents(this._checkUtility, this._testDriver, newTarget);
            } // otherwise the model is still running and should not be interrupted so it can achieve full coverage
        });
    }
}
