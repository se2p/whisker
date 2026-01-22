import {NeatChromosome} from "../neuroevolution/networks/NeatChromosome";
import {NetworkChromosome} from "../neuroevolution/networks/NetworkChromosome";
import {Randomness} from "../../utils/Randomness";
import WhiskerUtil from "../../../test/whisker-util";
import {Container} from "../../utils/Container";
import {AgentSuiteResults, StatisticsCollector} from "../../utils/StatisticsCollector";
import {BasicNeuroevolutionParameter} from "../neuroevolution/hyperparameter/BasicNeuroevolutionParameter";
import {NetworkExecutor} from "../neuroevolution/misc/NetworkExecutor";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {NetworkLoader} from "../neuroevolution/networkGenerators/NetworkLoader";
import {NetworkAnalysis} from "../neuroevolution/misc/NetworkAnalysis";
import {MutationFactory} from "../../scratch/ScratchMutation/MutationFactory";
import logger from "../../../util/logger";
import {Project} from "../../../assembler/project/Project";
import {ActionNode} from "../neuroevolution/networkComponents/ActionNode";
import {ModelTester} from "../../model/ModelTester";
import {SpriteTrace} from "../../testcase/ExecutionTrace";
import {AgentExecutor} from "./AgentExecutor";
import VirtualMachine from "scratch-vm";


export class NeatestSuiteExecutor extends AgentExecutor {

    /**
     * JSON representation of the dynamic test suite.
     */
    private readonly _testSuiteJSON: unknown;

    /**
     * Saves the parameter of the test suite.
     */
    protected parameter: BasicNeuroevolutionParameter;

    /**
     * The used instance of a network executor.
     */
    protected executor: NetworkExecutor;

    /**
     * The name of the executed test.
     */
    protected testName: string

    /**
     * The loaded agents.
     */
    private _agents: NeatChromosome[] = [];


    protected constructor(project: ArrayBuffer, vm: VirtualMachine,
                          properties: Record<string, number | string | string[] | boolean>,
                          testFile: string) {
        super(project, vm, properties);
        this._testSuiteJSON = JSON.parse(testFile);
        this.testName = properties.testName as string;
    }

    /**
     * Initializes components required for executing the suite on the specified program.
     * @param modelTester Handles the execution of MBT.
     */
    protected override async _initialize(modelTester: ModelTester): Promise<void> {
        await super._initialize(modelTester);
        this.initialiseExecutionParameter();
    }

    /**
     * Loads and initializes the given agents.
     * @returns The initialized agents.
     */
    protected override async _loadAgents(): Promise<NeatChromosome[]> {
        const eventExtractor = new NeuroevolutionScratchEventExtractor(this._vm, this.parameter.classificationType);
        const networkLoader = new NetworkLoader(this._testSuiteJSON['Networks'], eventExtractor.extractStaticEvents(this._vm));
        const agents = networkLoader.loadNetworks();

        // Record activation traces
        if (Number(this._properties.activationTraceRepetitions) > 0) {
            logger.debug("Recording Activation Trace");
            await this.collectActivationTrace(agents);
        }

        this._agents = agents;
        return agents;

    }

    /**
     * Executes the given suite against the specified program.
     * @param agents The suite of agents to be executed.
     * @returns Execution traces obtained by executing the suite against the specified program.
     */
    protected override async _executeSuiteOnOriginal(agents: NeatChromosome[]): Promise<SpriteTrace[]> {
        // Execute all networks on the single project.
        const spriteTraces: SpriteTrace[] = [];
        for (let i = 0; i < agents.length; i++) {
            logger.info(`Executing test ${i}`);
            const spriteTrace = await this.executeTestCase(agents[i], true);
            spriteTraces.push(spriteTrace);
        }
        await this.updateTestStatistics(agents, this.projectName, this.testName);
        return spriteTraces;
    }

    /**
     * Performs a mutation analysis experiment to determine how many mutants the given suite can detect.
     * @param agents The suite of agents to be executed.
     * @returns The mutated programs.
     */
    protected override async _mutationAnalysis(agents: NeatChromosome[]): Promise<Project[]> {
        const mutantFactory = new MutationFactory(this._vm, this._properties.mutators as string[]);
        const maxMutants = this._properties.maxMutants as number || Number.MAX_SAFE_INTEGER;
        const mutantPrograms: Project[] = [];
        let i = 0;
        while (i < maxMutants && mutantFactory.candidates.size > 0) {
            // Generate mutant
            const mutant = mutantFactory.generateRandomMutant();
            if (mutant == null) {
                continue;
            }
            await this.loadMutant(mutant);

            // Save mutant for download. This may cause memory issues!
            if (this._properties.downloadMutants) {
                mutantPrograms.push(mutant);
            }

            // Execute test suite on mutant
            const projectMutation = `${this.projectName}-${mutant.mutantName}`;
            logger.debug(`Analysing mutant ${i}: ${projectMutation}`);
            ModelTester.getInstance().clearCoverage();
            const executedTests: NeatChromosome[] = [];
            this.initialiseCoverageMaps(this._vm);
            for (let i = 0; i < agents.length; i++) {
                logger.debug(`Executing test ${i}`);
                const test = agents[i];

                // Clone the network since it might get changed, e.g., if the mutant contains new events.
                const testClone = test.cloneAsTestCase();
                await this.executeTestCase(testClone, true);
                executedTests.push(testClone);

                if (this.isMutant(testClone, test, false)) {
                    logger.debug("Mutant detected; Stop testing for this mutant...");
                    break;
                }
            }
            await this.updateTestStatistics(executedTests, projectMutation, this.testName);
            i++;
        }
        return mutantPrograms;
    }

    /**
     * Initializes the used parameter for test execution.
     */
    private initialiseExecutionParameter(): void {
        const config = new WhiskerSearchConfiguration(this._testSuiteJSON['Configs']);
        this.parameter = config.dynamicSuiteParameter;
        Container.config = config;

        if (this._properties.winningStates) {
            StatisticsCollector.getInstance().parseWinningStates(this._properties.winningStates as string);
        }

        this.executor = new NetworkExecutor(Container.vmWrapper, this.parameter.timeout, 'activation', this.parameter.classificationType, false);
    }

    /**
     * Executes a single dynamic test case and records corresponding statistics.
     * @param test the dynamic test case to execute.
     * @param recordExecution determines whether we want to record this execution by updating the archive and
     * analyzing network metrics.
     */
    private async executeTestCase(test: NeatChromosome, recordExecution: boolean): Promise<SpriteTrace> {
        test.recordNetworkStatistics = true;
        const executionTrace = await this.executor.execute(test);
        if (recordExecution) {
            await this.updateStatementArchive(test);
            await this.updateBranchArchive(test);
            NetworkAnalysis.analyseNetwork(test);
        }
        test.recordNetworkStatistics = false;
        await this.executor.resetState();
        return executionTrace.positionTrace;
    }


    /**
     * Executes a test for a user-defined number of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    private async collectActivationTrace(agents: NeatChromosome[]): Promise<void> {
        const repetitions = parseInt(this._properties.activationTraceRepetitions as string);
        const originalSeed = Randomness.scratchSeed;
        const scratchSeeds = Array(repetitions).fill(Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER)).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));
        for (let i = 0; i < agents.length; i++) {
            logger.debug(`Recording Trace for test ${i + 1} / ${agents.length}`);
            const test = agents[i];
            for (const seed of scratchSeeds) {
                Randomness.setScratchSeed(seed, true);
                await this.executeTestCase(test, false);
            }

            // Save the recorded AT and uncertainty as reference and reset the current ones
            test.referenceActivationTrace = test.testActivationTrace.clone();
            test.testActivationTrace = undefined;
            test.referenceUncertainty = new Map<number, number>(test.testUncertainty);
            test.testUncertainty = new Map<number, number>();
        }
        ModelTester.getInstance().clearCurrentModelResults();
        ModelTester.getInstance().clearCoverage();
        Randomness.setScratchSeed(originalSeed);
        StatisticsCollector.getInstance().evaluations = 0;
    }


    /**
     * Saves the observed test execution statistics to later return them as a csv file.
     * @param testCases the executed testCases holding the execution results.
     * @param projectName the name of the executed project.
     * @param testName the name of the executed test file.
     */
    override async updateTestStatistics(testCases: readonly NeatChromosome[], projectName: string,
                                        testName: string): Promise<AgentSuiteResults[]> {
        const results = await super.updateTestStatistics(testCases, projectName, testName);
        for (let i = 0; i < testCases.length; i++) {
            const test = testCases[i];
            const isMutant = this.isMutant(test, this._agents[i], true);
            results[i].score = test.score;
            results[i].playTime = test.playTime;
            results[i].isMutant = isMutant;
        }
        return results;
    }

    /**
     * Determines whether the given test was executed on a mutant.
     * @param executedTest the network that just got executed on a Scratch program.
     * @param originalTest the original network from which the executed one got cloned off.
     * @param printReason if true the reason for the mutant being flagged as mutant is printed to the console.
     * @returns true if we suspect a mutant.
     */
    private isMutant(executedTest: Readonly<NetworkChromosome>, originalTest: Readonly<NetworkChromosome>, printReason = true): boolean {
        // If the network structure has changed within the output nodes, we have found new events suggesting that
        // something has been mutated within the controls of the program.
        const execClassNodes = executedTest.layers.get(1) as ActionNode[];
        const execEvents = execClassNodes.map(node => node.event.stringIdentifier());
        const originalClassNodes = originalTest.layers.get(1) as ActionNode[];
        const originalEvents = originalClassNodes.map(node => node.event.stringIdentifier());
        const newEvents = execEvents.filter(eventString => !originalEvents.includes(eventString));
        if (newEvents.length > 0) {
            if (printReason) {
                for (const newEvent of newEvents) {
                    logger.debug(`New Event ${newEvent}`);
                }
            }
            return true;
        }

        // If we encounter surprising node activations, we suspect a mutant.
        if (executedTest.surpriseCount > 0) {
            if (printReason) {
                logger.debug(`Surprising node activation count of ${executedTest.surpriseCount}`);
            }
            return true;
        }
        return false;
    }

    /**
     * Loads a given Scratch mutant by initializing the VmWrapper and the NetworkExecutor with the mutant.
     * @param mutant a mutant of a Scratch project.
     */
    private async loadMutant(mutant: Project): Promise<void> {
        const util = new WhiskerUtil(this._vm, mutant);
        await util.prepare(this._properties['acceleration'] as number || 1);
        const vmWrapper = util.getVMWrapper();
        this.initialiseCoverageMaps(vmWrapper.vm);
        this.executor = new NetworkExecutor(vmWrapper, this.parameter.timeout, 'activation', this.parameter.classificationType, false);
        Container.testDriver = util.getTestDriver({});
    }
}
