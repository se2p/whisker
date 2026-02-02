import VirtualMachine from "scratch-vm";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {BranchCoverageFitnessFunctionFactory} from "../../testcase/fitness/BranchCoverageFitnessFunctionFactory";
import {ModelTester} from "../../model/ModelTester";
import WhiskerUtil from "../../../test/whisker-util";
import {Container} from "../../utils/Container";
import {Randomness} from "../../utils/Randomness";
import {AgentSuiteResults, StatisticsCollector} from "../../utils/StatisticsCollector";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {Project} from "../../../assembler/project/Project";
import {SpriteTrace} from "../../testcase/ExecutionTrace";
import {BranchCoverageFitnessFunction} from "../../testcase/fitness/BranchCoverageFitnessFunction";
import logger from "../../../util/logger";
import {TestCase} from "../../core/TestCase";
import {ModelResult} from "../../../test-runner/model-result";

export abstract class AgentExecutor {

    /**
     * The name of the tested project.
     */
    protected projectName: string

    /**
     * Maps statements to the covering TestCase.
     */
    protected statementArchive = new Map<StatementFitnessFunction, TestCase>();

    /**
     * Maps branches to the covering TestCase.
     */
    protected branchArchive = new Map<BranchCoverageFitnessFunction, TestCase>();


    protected constructor(protected readonly _project: ArrayBuffer, protected readonly _vm: VirtualMachine,
                          protected readonly _properties: Record<string, number | string | string[] | boolean>) {
        this.projectName = _properties.projectName as string;
    }

    /**
     * Initializes components required for executing the suite on the specified program.
     * @param modelTester Handles the execution of MBT.
     */
    protected async _initialize(modelTester: ModelTester): Promise<void> {
        this.setScratchSeed(this._properties.seed.toString());
        await this.initialiseCommonVariables(modelTester);
        this.initialiseCoverageMaps(this._vm);
    }

    /**
     * Loads and initializes the given agents.
     * @returns The initialized agents.
     */
    protected abstract _loadAgents(): Promise<TestCase[]>

    /**
     * Executes the given suite against the specified program.
     * @param agents The suite of agents to be executed.
     * @returns Execution traces obtained by executing the suite against the specified program.
     */
    protected abstract _executeSuiteOnOriginal(agents: TestCase[]): Promise<SpriteTrace[]>;

    /**
     * Performs a mutation analysis experiment to determine how many mutants the given suite can detect.
     * @param agents The suite of agents to be executed.
     * @returns The mutated programs.
     */
    protected abstract _mutationAnalysis(agents: TestCase[]): Promise<Project[]>;

    /**
     * Executes the given suite on the specified program or performs mutation analysis.
     * @param modelTester For executing {@linkcode ProgramModel} with inputs from the network.
     * @returns Triple of the csv results, execution traces and the mutated programs if mutation analysis was performed.
     */
    public async execute(modelTester: ModelTester): Promise<[string, SpriteTrace[], Project[]]> {
        await this._initialize(modelTester);
        const agents = await this._loadAgents();

        if (this._properties.mutators !== undefined && this._properties.mutators[0] !== 'NONE') {
            logger.info("Performing Mutation Analysis");
            const spriteTraces = await this._executeSuiteOnOriginal(agents);      // Execute the original program to obtain reference data
            const mutants = await this._mutationAnalysis(agents);
            return [StatisticsCollector.getInstance().asCSVAgentSuite(), spriteTraces, mutants];
        } else {
            logger.info("Testing Single Project");
            const spriteTraces = await this._executeSuiteOnOriginal(agents);
            return [StatisticsCollector.getInstance().asCSVAgentSuite(), spriteTraces, []];
        }
    }

    /**
     * Initialises the Scratch VM, Container variables used across Whisker and the StatisticsCollector responsible
     * for creating a csv file with the results of the suite execution.
     * @param modelTester For executing {@linkcode ProgramModel} with inputs from the network
     */
    protected async initialiseCommonVariables(modelTester: ModelTester): Promise<void> {
        // Set up Scratch VM.
        const util = new WhiskerUtil(this._vm, this._project, modelTester);
        const vmWrapper = util.getVMWrapper();
        await util.prepare(this._properties['acceleration'] as number || 1);
        // create TestDriver for Model before vmWrapper starts
        const testDriver = util.getTestDriver({extend: undefined});
        await util.start();

        // Activate CoverageTracing
        this._vm.registerCoverageTracer(true);

        // Set up Container variables.
        Container.vm = this._vm;
        Container.vmWrapper = vmWrapper;
        Container.testDriver = testDriver;
        Container.acceleration = this._properties['acceleration'] as number;
    }


    /**
     * Initialises the coverage maps.
     */
    protected initialiseCoverageMaps(vm: VirtualMachine): void {
        // Initialise Statements
        const statementFactory = new StatementFitnessFunctionFactory();
        const statementObjectives = statementFactory.extractFitnessFunctions(vm, []);
        this.statementArchive = new Map<StatementFitnessFunction, TestCase>();
        for (const statement of statementObjectives) {
            this.statementArchive.set(statement, null);
        }

        // Initialise Branches
        const branchFactory = new BranchCoverageFitnessFunctionFactory();
        const branchObjectives = branchFactory.extractFitnessFunctions(vm, []);
        this.branchArchive = new Map<BranchCoverageFitnessFunction, TestCase>();
        for (const branch of branchObjectives) {
            this.branchArchive.set(branch, null);
        }
    }

    /**
     * Sets a user-defined or random seed for the Whisker number generator and the Scratch-VM.
     */
    protected setScratchSeed(seed: string): void {
        // Check if a seed has been set.
        if (seed !== 'undefined' && seed !== "") {
            Randomness.setInitialSeeds(seed);
        }
        // If not, set a random seed.
        else {
            Randomness.setInitialSeeds(Date.now());
            this._properties.seed = Randomness.scratchSeed;
        }
    }

    /**
     * Updates the archive of covered statement fitness functions.
     * @param agent the network with which the archive should be updated.
     */
    protected async updateStatementArchive(agent: TestCase): Promise<void> {
        for (const statement of this.statementArchive.keys()) {
            if (!this.statementArchive.get(statement) && agent.getCoveredBlocks().has(statement.getNodeId())) {
                this.statementArchive.set(statement, agent);
            }
        }
    }

    /**
     * Updates the archive of covered branch fitness functions.
     * @param agent the network with which the archive should be updated.
     */
    protected async updateBranchArchive(agent: TestCase): Promise<void> {
        for (const branch of this.branchArchive.keys()) {
            if (!this.branchArchive.get(branch) && agent.getCoveredBranches().has(branch.getNodeId())) {
                this.branchArchive.set(branch, agent);
            }
        }
    }

    /**
     * Saves the observed agent execution statistics to later return them as a csv file.
     * @param agents the executed agents holding the execution results.
     * @param projectName the name of the executed project.
     * @param agentName the name of the executed agents.
     */
    protected async updateTestStatistics(agents: readonly TestCase[], projectName: string,
                                         agentName: string): Promise<AgentSuiteResults[]> {
        const testResults = Container.vmWrapper.updateProgramModelSummaryForProject(projectName);
        let modelResults: ModelResult[] = null;
        const enoughModelResults = testResults.length >= agents.length;
        if (enoughModelResults) {
            modelResults = testResults
                .slice(testResults.length - agents.length, testResults.length)
                .map(t => t.modelResult);
        } else if (ModelTester.getInstance().someModelLoaded()) {
            const temp = Container.vmWrapper.getTestResultsSummary();
            console.debug("there were", testResults.length, "model results but", agents.length, "dynamic test cases. Projects:",
                Object.keys(temp).map(key => `key: ${key}, value: ${temp[key].length}`));
        }

        const statements = [...this.statementArchive.keys()].map(st => st.getNodeId());
        const branches = [...this.branchArchive.keys()].map(br => br.getNodeId());
        const archiveStatCovered = [...this.statementArchive.values()].filter(val => val !== null).length;
        const archiveBrCovered = [...this.branchArchive.values()].filter(val => val !== null).length;

        const results = [];
        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            const statCovered = [...agent.getCoveredBlocks()].filter(st => statements.includes(st)).length;
            const branchCovered = [...agent.getCoveredBranches()].filter(br => branches.includes(br)).length;
            const [wonAgent, wonSuite] = await this._getWinningResults(projectName, agent);

            const agentResults: AgentSuiteResults = {
                projectName: projectName,
                agentName: agentName,
                agentID: i,
                seed: this._properties.seed.toString(),
                statements: statements.length,
                statementCoverageAgent: Math.round((statCovered / statements.length) * 100) / 100,
                statementCoverageSuite: Math.round((archiveStatCovered / statements.length) * 100) / 100,
                branches: branches.length,
                branchCoverageAgent: Math.round((branchCovered / branches.length) * 100) / 100,
                branchCoverageSuite: Math.round((archiveBrCovered / branches.length) * 100) / 100,
                wonAgent: wonAgent,
                wonSuite: wonSuite,
                modelResult: enoughModelResults ? modelResults[i] : null
            };
            results.push(agentResults);
            StatisticsCollector.getInstance().addAgentSuiteResults(agentResults);
        }
        return results;
    }

    /**
     * Determines whether the agent/suite has reached the winning state.
     * @param projectName the name of the project.
     * @param agent the agent that should be evaluated.
     * @returns tuple defining whether the agent/suite was able to reach the winning state.
     * @private
     */
    private async _getWinningResults(projectName: string, agent: TestCase): Promise<[boolean, boolean]> {
        const winningState = StatisticsCollector.getInstance().getWinningStateForProject(projectName);

        if (!winningState) {
            return [false, false];
        }

        const winningObjective = [...this.statementArchive.keys()].find(obj => obj.getNodeId() == winningState);
        const wonAgent = agent.getCoveredBlocks().has(winningState);
        const wonSuite = this.statementArchive.get(winningObjective) !== null;
        return [wonAgent, wonSuite];
    }


}
