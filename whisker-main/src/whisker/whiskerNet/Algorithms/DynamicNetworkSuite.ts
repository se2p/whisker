import {FitnessFunction} from "../../search/FitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Randomness} from "../../utils/Randomness";
import WhiskerUtil from "../../../test/whisker-util";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {Container} from "../../utils/Container";
import {NetworkTestSuiteResults, StatisticsCollector} from "../../utils/StatisticsCollector";
import {BasicNeuroevolutionParameter} from "../HyperParameter/BasicNeuroevolutionParameter";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Chromosome} from "../../search/Chromosome";
import {ScratchProgram} from "../../scratch/ScratchInterface";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import {NetworkAnalysis} from "../Misc/NetworkAnalysis";
import {MutationFactory} from "../../scratch/ScratchMutation/MutationFactory";
import {BranchCoverageFitnessFunctionFactory} from "../../testcase/fitness/BranchCoverageFitnessFunctionFactory";
import logger from "../../../util/logger";


export class DynamicNetworkSuite {

    /**
     * JSON representation of the dynamic test suite.
     */
    private readonly _testSuiteJSON: unknown;

    /**
     * Maps statement fitness function keys to fitness functions.
     */
    protected statementMap: Map<number, FitnessFunction<Chromosome>>;

    /**
     * Maps branching fitness function keys to fitness functions.
     */
    protected branchMap: Map<number, FitnessFunction<Chromosome>>;

    /**
     * Saves for each covered statement fitness key, a network capable of covering the respective fitness function.
     */
    protected statementArchive = new Map<number, NetworkChromosome>();

    /**
     * Saves for each covered branch fitness key, a network capable of covering the respective fitness function.
     */
    protected branchArchive = new Map<number, NetworkChromosome>();

    /**
     * Saves the parameter of the test suite.
     */
    protected parameter: BasicNeuroevolutionParameter;

    /**
     * The used instance of a network executor.
     */
    protected executor: NetworkExecutor;

    /**
     * The name of the tested project.
     */
    protected projectName: string

    /**
     * The name of the executed test.
     */
    protected testName: string

    /**
     * Holds the loaded test cases.
     */
    protected testCases: NeatChromosome[];

    protected constructor(protected project: ArrayBuffer, protected vm: VirtualMachine, testFile: string,
                          protected properties: Record<string, number | string | string[] | boolean>) {
        this._testSuiteJSON = JSON.parse(testFile);
        this.projectName = this.properties.projectName as string;
        this.testName = this.properties.testName as string;
    }

    /**
     * Initialises the used parameter for test execution.
     */
    protected initialiseExecutionParameter(): void {
        const config = new WhiskerSearchConfiguration(this._testSuiteJSON['Configs']);
        this.parameter = config.dynamicSuiteParameter;
        this.executor = new NetworkExecutor(Container.vmWrapper, this.parameter.timeout, 'activation', false);
        Container.config = config;
    }

    /**
     * Loads the dynamic test cases by initialising the saved networks.
     */
    protected loadTestCases(): NeatChromosome[] {
        const fitnessTargets = [...this.statementMap.values()]
            .concat(...this.branchMap.values()) as unknown as StatementFitnessFunction[];
        const eventExtractor = new NeuroevolutionScratchEventExtractor(this.vm);
        const networkLoader = new NetworkLoader(this._testSuiteJSON['Networks'],
            eventExtractor.extractStaticEvents(this.vm), fitnessTargets);
        return networkLoader.loadNetworks();
    }

    /**
     * Executes a single dynamic test case and records corresponding statistics.
     * @param test the dynamic test case to execute.
     * @param recordExecution determines whether we want to record this execution by updating the archive and
     * analysing network metrics.
     */
    protected async executeTestCase(test: NeatChromosome, recordExecution: boolean): Promise<void> {
        test.recordNetworkStatistics = true;
        await this.executor.execute(test);
        if (recordExecution) {
            await this.updateStatementArchive(test);
            await this.updateBranchArchive(test);
            NetworkAnalysis.analyseNetwork(test);
        }
        test.recordNetworkStatistics = false;
        await this.executor.resetState();
    }

    /**
     * Executes the dynamic test suite consisting of networks on a single test project.
     */
    protected async testSingleProject(): Promise<void> {
        // Execute all networks on the single project.
        for (let i = 0; i < this.testCases.length; i++) {
            logger.debug(`Executing test ${i}`);
            await this.executeTestCase(this.testCases[i], true);
        }
        await this.updateTestStatistics(this.testCases, this.projectName, this.testName);
    }

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected async mutationAnalysis(): Promise<ScratchProgram[]> {
        const mutantFactory = new MutationFactory(this.vm, this.properties.mutators as string[]);
        const maxMutants = this.properties.maxMutants as number || Number.MAX_SAFE_INTEGER;
        const mutantPrograms: ScratchProgram[] = [];
        let i = 0;
        while (i < maxMutants && mutantFactory.candidates.size > 0) {
            // Generate mutant
            const mutant = mutantFactory.generateRandomMutant();
            if (mutant == null) {
                continue;
            }

            // Save mutant for download. This may cause memory issues!
            if (this.properties.downloadMutants) {
                mutantPrograms.push(mutant);
            }

            // Execute test suite on mutant
            const projectMutation = `${this.projectName}-${mutant.name}`;
            logger.debug(`Analysing mutant ${i}: ${projectMutation}`);
            const executedTests: NeatChromosome[] = [];
            this.statementArchive.clear();
            this.branchArchive.clear();
            for (let i = 0; i < this.testCases.length; i++) {
                logger.debug(`Executing test ${i}`);
                const test = this.testCases[i];
                // We clone the network since it might get changed due to specific mutations.
                const testClone = test.cloneAsTestCase();
                await this.loadMutant(mutant);
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
     * Executes a test for a user-defined number of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    protected async collectActivationTrace(): Promise<void> {
        const repetitions = parseInt(this.properties.activationTraceRepetitions as string);
        const originalSeed = Randomness.scratchSeed;
        const scratchSeeds = Array(repetitions).fill(Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER)).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));
        for (let i = 0; i < this.testCases.length; i++) {
            logger.debug(`Recording Trace for test ${i + 1} / ${this.testCases.length}`);
            const test = this.testCases[i];
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
        Randomness.setScratchSeed(originalSeed);
        StatisticsCollector.getInstance().numberFitnessEvaluations = 0;
    }

    /**
     * Executes the given network suite by fist initialising required fields and then executing the respective test
     * cases on the original project or the created mutants.
     * @returns Results of network suite execution in csv format.
     */
    protected async execute(): Promise<[string, ScratchProgram[]]> {

        // Initialise the seed, hyperParameters, fitness objectives and the VM
        this.setScratchSeed();
        await this.initialiseCommonVariables();
        this.initialiseExecutionParameter();
        this.initialiseFitnessTargets(this.vm);
        this.testCases = this.loadTestCases();
        if (this.properties.minimiseSuite && this.testCases.length > 1) {
            await this.minimiseSuite();
        }

        // Record activation traces
        if (Number(this.properties.activationTraceRepetitions) > 0) {
            logger.debug("Recording Activation Trace");
            await this.collectActivationTrace();
        }

        if (this.properties.mutators !== undefined && this.properties.mutators[0] !== 'NONE') {
            logger.debug("Performing Mutation Analysis");
            await this.testSingleProject();     // Execute the original program to obtain reference data
            const mutants = await this.mutationAnalysis();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), mutants];
        } else {
            logger.debug("Testing Single Project");
            await this.testSingleProject();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), []];
        }
    }

    /**
     * Initialises the Scratch VM, Container variables used across Whisker and the StatisticsCollector responsible
     * for creating a csv file with the results of the test execution.
     */
    private async initialiseCommonVariables(): Promise<void> {
        // Set up Scratch VM.
        const util = new WhiskerUtil(this.vm, this.project);
        const vmWrapper = util.getVMWrapper();
        await util.prepare(this.properties['acceleration'] as number || 1);
        await util.start();

        // Set up Container variables.
        Container.vm = this.vm;
        Container.vmWrapper = vmWrapper;
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = this.properties['acceleration'] as number;
    }

    /**
     * Sets a user-defined or random seed for the Whisker number generator and the Scratch-VM.
     */
    private setScratchSeed(): void {
        // Check if a seed has been set.
        const seedString = this.properties.seed.toString();
        if (seedString !== 'undefined' && seedString !== "") {
            Randomness.setInitialSeeds(seedString);
        }
        // If not set a random seed.
        else {
            Randomness.setInitialSeeds(Date.now());
            this.properties.seed = Randomness.scratchSeed;
        }
    }

    /**
     * Initialises the statement map.
     */
    private initialiseFitnessTargets(vm: VirtualMachine): void {
        // Initialise Statements
        const statementFactory = new StatementFitnessFunctionFactory();
        const statementTargets = statementFactory.extractFitnessFunctions(vm, []);
        this.statementMap = new Map<number, FitnessFunction<Chromosome>>();
        for (let i = 0; i < statementTargets.length; i++) {
            this.statementMap.set(i, statementTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }

        // Initialise Branches
        const branchFactory = new BranchCoverageFitnessFunctionFactory();
        const branchTargets = branchFactory.extractFitnessFunctions(vm, []);
        this.branchMap = new Map<number, FitnessFunction<Chromosome>>();
        for (let i = 0; i < branchTargets.length; i++) {
            this.branchMap.set(i, branchTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }
    }

    /**
     * Minimises the test suite to only contain tests required for reaching the maximum amount of coverage.
     */
    protected async minimiseSuite(): Promise<void> {
        logger.debug("Minimising Test Suite....");
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            await test.determineCoveredObjectives([...this.branchMap.values()]);
        }
        this.testCases.sort((a, b) => b.coveredStatements - a.coveredStatements);
        let coverage = 0;
        const shortenedTestCases = [];
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            test.testActivationTrace = undefined;
            test.testUncertainty = new Map<number, number>();
            await this.updateBranchArchive(test);

            // Branches subsume statements, thus when minimising we focus on branch coverage.
            if ([...this.branchArchive.keys()].length > coverage) {
                coverage = [...this.branchArchive.keys()].length;
                shortenedTestCases.push(test);
            }

            // Branches subsume statements, thus when minimising we focus on branch coverage.
            if ([...this.branchMap.keys()].length === [...this.branchArchive.keys()].length) {
                break;
            }
        }
        logger.debug(`Minimised from ${this.testCases.length} tests to ${shortenedTestCases.length} tests`);
        this.testCases = shortenedTestCases;
        this.branchArchive.clear();
    }

    /**
     * Updates the archive of covered statement fitness functions.
     * @param network the network with which the archive should be updated.
     */
    protected async updateStatementArchive(network: NeatChromosome): Promise<void> {
        for (const statementKey of this.statementMap.keys()) {
            const fitnessFunction = this.statementMap.get(statementKey);
            const statementFitness = await fitnessFunction.getFitness(network);
            if (!this.statementArchive.has(statementKey) && await fitnessFunction.isOptimal(statementFitness)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this.statementArchive.set(statementKey, network);
            }
        }
    }

    /**
     * Updates the archive of covered branch fitness functions.
     * @param network the network with which the archive should be updated.
     */
    protected async updateBranchArchive(network: NeatChromosome): Promise<void> {
        for (const branchKey of this.branchMap.keys()) {
            const fitnessFunction = this.branchMap.get(branchKey);
            const branchFitness = await fitnessFunction.getFitness(network);
            if (!this.branchArchive.has(branchKey) && await fitnessFunction.isOptimal(branchFitness)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this.branchArchive.set(branchKey, network);
            }
        }
    }

    /**
     * Saves the observed test execution statistics to later return them as a csv file.
     * @param testCases the executed testCases holding the execution results.
     * @param projectName the name of the executed project.
     * @param testName the name of the executed test file.
     */
    protected async updateTestStatistics(testCases: readonly NeatChromosome[], projectName: Readonly<string>,
                                         testName: Readonly<string>): Promise<void> {
        for (let i = 0; i < testCases.length; i++) {
            const test = testCases[i];
            const statements = [...this.statementMap.keys()].length;
            const branches = [...this.branchMap.keys()].length;
            const statCovered = await test.determineCoveredObjectives([...this.statementMap.values()]);
            const branchCovered = await test.determineCoveredObjectives([...this.branchMap.values()]);
            const currentUncertainty = [...test.testUncertainty.values()];
            const averageUncertainty = currentUncertainty.reduce((pv, cv) => pv + cv, 0) / currentUncertainty.length;
            const isMutant = this.isMutant(test, this.testCases[i], true);

            const testResult: NetworkTestSuiteResults = {
                projectName: projectName,
                testName: testName,
                testID: i,
                seed: this.properties.seed.toString(),
                statements: statements,
                statementCoverageTest: Math.round((statCovered / statements) * 100) / 100,
                statementCoverageSuite: Math.round((this.statementArchive.size / statements) * 100) / 100,
                branches: branches,
                branchCoverageTest: Math.round((branchCovered / branches) * 100) / 100,
                branchCoverageSuite: Math.round((this.branchArchive.size / branches) * 100) / 100,
                score: test.score,
                playTime: test.playTime,
                surpriseNodeAdequacy: test.averageLSA,
                surpriseCount: test.surpriseCount,
                avgUncertainty: averageUncertainty,
                isMutant: isMutant,
            };
            StatisticsCollector.getInstance().addNetworkSuiteResult(testResult);
        }
    }

    /**
     * Determines whether the given test was executed on a mutant.
     * @param executedTest the network that just got executed on a Scratch program.
     * @param originalTest the original network from which the executed one got cloned off.
     * @param printReason if true the reason for the mutant being flagged as mutant is printed to the console.
     * @returns true if we suspect a mutant.
     */
    public isMutant(executedTest: Readonly<NetworkChromosome>, originalTest: Readonly<NetworkChromosome>, printReason = true): boolean {
        // If the network structure has changed within the output nodes, we have found new events suggesting that
        // something has been mutated within the controls of the program.
        const execClassNodes = executedTest.layers.get(1).filter(node => node instanceof ClassificationNode) as ClassificationNode[];
        const execEvents = execClassNodes.map(node => node.event.stringIdentifier());
        const originalClassNodes = originalTest.layers.get(1).filter(node => node instanceof ClassificationNode) as ClassificationNode[];
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

        // If we encounter surprising node activations we suspect a mutant.
        if (executedTest.surpriseCount > 0) {
            if (printReason) {
                logger.debug(`Surprising node activation count of ${executedTest.surpriseCount}`);
            }
            return true;
        }
        return false;
    }

    /**
     * Loads a given Scratch mutant by initialising the VmWrapper and the NetworkExecutor with the mutant.
     * @param mutant a mutant of a Scratch project.
     */
    protected async loadMutant(mutant: ScratchProgram): Promise<void> {
        const util = new WhiskerUtil(this.vm, mutant);
        await util.prepare(this.properties['acceleration'] as number || 1);
        const vmWrapper = util.getVMWrapper();
        this.initialiseFitnessTargets(vmWrapper.vm);
        this.executor = new NetworkExecutor(vmWrapper, this.parameter.timeout, 'activation', false);
    }
}
