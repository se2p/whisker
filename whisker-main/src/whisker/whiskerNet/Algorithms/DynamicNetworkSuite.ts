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


export class DynamicNetworkSuite {

    /**
     * JSON representation of the dynamic test suite.
     */
    private readonly _testSuiteJSON;

    /**
     * Maps fitness function keys to fitness functions.
     */
    protected statementMap: Map<number, FitnessFunction<Chromosome>>;

    /**
     * Saves for each covered fitness function key, a network capable of covering the respective fitness function.
     */
    protected archive = new Map<number, NetworkChromosome>();

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
        const fitnessTargets = [...this.statementMap.values()] as unknown as StatementFitnessFunction[];
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
            await this.updateArchiveAsync(test);
            NetworkAnalysis.analyseNetwork(test);
        }
        test.recordNetworkStatistics = false;
        this.executor.resetState();
    }

    /**
     * Executes the dynamic test suite consisting of networks on a single test project.
     */
    protected async testSingleProject(): Promise<void> {
        // Execute all networks on the single project.
        for (let i = 0; i < this.testCases.length; i++) {
            Container.debugLog(`Executing test ${i}`);
            await this.executeTestCase(this.testCases[i], true);
        }
        await this.updateTestStatistics(this.testCases, this.projectName, this.testName);
    }

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected async mutationAnalysis(): Promise<ScratchProgram[]> {
        const mutantFactory = new MutationFactory(this.vm);
        const mutantPrograms = mutantFactory.generateScratchMutations(this.properties.mutators as string[], this.properties.maxMutants as number);
        let i = 0;
        while (mutantPrograms.length > 0) {
            const mutant = mutantPrograms.pop();
            this.archive.clear();
            const projectMutation = `${this.projectName}-${mutant.name}`;
            Container.debugLog(`Analysing mutant ${i}: ${projectMutation}`);
            const executedTests: NeatChromosome[] = [];
            for (let i = 0; i < this.testCases.length; i++) {
                Container.debugLog(`Executing test ${i}`);
                const test = this.testCases[i];
                // We clone the network since it might get changed due to specific mutations.
                const testClone = test.cloneAsTestCase();
                await this.loadMutant(mutant);
                await this.executeTestCase(testClone, true);
                executedTests.push(testClone);
                if (this.isMutant(testClone, test, false)) {
                    Container.debugLog("Mutant detected; Stop testing for this mutant...");
                    break;
                }
            }
            await this.updateTestStatistics(executedTests, projectMutation, this.testName);
            i++;
        }
        return [];
    }

    /**
     * Executes a test for a user-defined amount of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    protected async collectActivationTrace(): Promise<void> {
        const repetitions = parseInt(this.properties.activationTraceRepetitions as string);
        const originalSeed = Randomness.scratchSeed;
        const scratchSeeds = Array(repetitions).fill(Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER)).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));
        for (let i = 0; i < this.testCases.length; i++) {
            Container.debugLog(`Recording Trace for test ${i + 1} / ${this.testCases.length}`);
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
     */
    protected async execute(): Promise<[string, ScratchProgram[]]> {

        // Initialise the seed, hyperParameters, fitness objectives and the VM
        this.setScratchSeed();
        await this.initialiseCommonVariables();
        this.initialiseExecutionParameter();
        this.initialiseFitnessTargets(this.vm);
        this.testCases = this.loadTestCases();
        if (this.testCases.length > 1) {
            await this.minimiseSuite();
        }

        // Record activation traces
        if (this.properties.activationTraceRepetitions > 0) {
            Container.debugLog("Recording Activation Trace");
            await this.collectActivationTrace();
        }

        if (this.properties.mutators !== undefined && this.properties.mutators[0] !== 'NONE') {
            Container.debugLog("Performing Mutation Analysis");
            await this.testSingleProject();     // Execute the original program to obtain reference data
            await this.mutationAnalysis();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), []];
        } else {
            Container.debugLog("Testing Single Project");
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
        util.start();

        // Set up Container variables.
        Container.vm = this.vm;
        Container.vmWrapper = vmWrapper;
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = this.properties['acceleration'] as number;
        if (this.properties['log'] === true) {
            Container.debugLog = (...data) => console.log('DEBUG:', ...data);
        } else {
            Container.debugLog = () => { /* No operation */ };
        }
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
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(vm, []);
        this.statementMap = new Map<number, FitnessFunction<Chromosome>>();
        for (let i = 0; i < fitnessTargets.length; i++) {
            this.statementMap.set(i, fitnessTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessTargets.length;
    }

    /**
     * Minimises the test suite to only contain tests required for reaching the maximum amount of coverage.
     */
    protected async minimiseSuite(): Promise<void> {
        Container.debugLog("Minimising Test Suite....");
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            await test.determineCoveredObjectivesAsync([...this.statementMap.values()]);
        }
        this.testCases.sort((a, b) => b.coveredStatements - a.coveredStatements);
        let coverage = 0;
        const shortenedTestCases = [];
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            test.testActivationTrace = undefined;
            test.testUncertainty = new Map<number, number>();
            await this.updateArchiveAsync(test);
            if ([...this.archive.keys()].length > coverage) {
                coverage = [...this.archive.keys()].length;
                shortenedTestCases.push(test);
            }
            if ([...this.statementMap.keys()].length === [...this.archive.keys()].length) {
                break;
            }
        }
        Container.debugLog(`Minimised from ${this.testCases.length} tests to ${shortenedTestCases.length} tests`);
        this.testCases = shortenedTestCases;
        this.archive.clear();
    }

    /**
     * Updates the archive of covered fitness functions.
     * @param network the network with which the archive should be updated.
     */
    protected async updateArchiveAsync(network: NeatChromosome): Promise<void> {
        for (const statementKey of this.statementMap.keys()) {
            const fitnessFunction = this.statementMap.get(statementKey);
            const statementFitness = await fitnessFunction.getFitnessAsync(network);
            if (await fitnessFunction.isOptimalAsync(statementFitness) && !this.archive.has(statementKey)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this.archive.set(statementKey, network);
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
            await test.determineCoveredObjectivesAsync([...this.statementMap.values()]);
            const currentUncertainty = [...test.testUncertainty.values()];
            const averageUncertainty = currentUncertainty.reduce((pv, cv) => pv + cv, 0) / currentUncertainty.length;
            const isMutant = this.isMutant(test, this.testCases[i], true);

            const testResult: NetworkTestSuiteResults = {
                projectName: projectName,
                testName: testName,
                testID: i,
                seed: this.properties.seed.toString(),
                totalObjectives: [...this.statementMap.keys()].length,
                coveredObjectivesByTest: test.coveredStatements,
                coveredObjectivesBySuite: [...this.archive.keys()].length,
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
        const execClassNodes = executedTest.outputNodes.filter(node => node instanceof ClassificationNode) as ClassificationNode[];
        const execEvents = execClassNodes.map(node => node.event.stringIdentifier());
        const originalClassNodes = originalTest.outputNodes.filter(node => node instanceof ClassificationNode) as ClassificationNode[];
        const originalEvents = originalClassNodes.map(node => node.event.stringIdentifier());
        const newEvents = execEvents.filter(eventString => !originalEvents.includes(eventString));
        if (newEvents.length > 0) {
            if (printReason) {
                for (const newEvent of newEvents) {
                    Container.debugLog(`New Event ${newEvent}`);
                }
            }
            return true;
        }

        // If we encounter surprising node activations we suspect a mutant.
        if (executedTest.surpriseCount > 0) {
            if (printReason) {
                Container.debugLog(`Surprising node activation count of ${executedTest.surpriseCount}`);
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
