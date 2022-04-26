import {FitnessFunction} from "../../search/FitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Randomness} from "../../utils/Randomness";
import WhiskerUtil from "../../../test/whisker-util";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {Container} from "../../utils/Container";
import {NetworkTestSuiteResults, StatisticsCollector} from "../../utils/StatisticsCollector";
import {NetworkSuiteParameter} from "../HyperParameter/NetworkSuiteParameter";
import {SurpriseAdequacy} from "../Misc/SurpriseAdequacy";
import {NetworkExecutor} from "../NetworkExecutor";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Chromosome} from "../../search/Chromosome";
import {ScratchProgram} from "../../scratch/ScratchInterface";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";


export abstract class NetworkSuite {

    /**
     * Maps a number as fitness function key to a fitness function.
     */
    protected statementMap: Map<number, FitnessFunction<Chromosome>>;

    /**
     * Saves for each covered fitness function key, a network capable of covering the respective fitness function.
     */
    protected archive = new Map<number, NetworkChromosome>();

    /**
     * Saves the parameter of the test suite.
     */
    protected parameter: NetworkSuiteParameter;

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

    protected constructor(protected project: ArrayBuffer, protected vm: VirtualMachine,
                          protected properties: Record<string, number | string | string[]>) {
        this.projectName = this.properties.projectName as string;
        this.testName = this.properties.testName as string;
    }

    /**
     * Initialises the used parameter for test execution.
     */
    protected abstract initialiseExecutionParameter(): void;

    /**
     * Loads the test cases.
     */
    protected abstract loadTestCases(): NeatChromosome[];

    /**
     * Executes a single test case and records corresponding statistics.
     * @param test the test case to execute.
     * @param recordExecution determines whether we want to record this execution by updating the archive and the
     * test execution statistics
     */
    protected abstract executeTestCase(test: NeatChromosome, recordExecution: boolean): Promise<void>;

    /**
     * Tests a single project by executing the given test suite.
     */
    protected abstract testSingleProject(): Promise<void>;

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected abstract mutationAnalysis(): Promise<ScratchProgram[]>;

    /**
     * Executes a test for a user-defined amount of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    protected abstract collectActivationTrace(): Promise<void>;

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
            console.log("Recording Activation Trace");
            await this.collectActivationTrace();
        }

        if (this.properties.mutators !== undefined && this.properties.mutators[0] !== 'NONE') {
            console.log("Performing Mutation Analysis");
            await this.testSingleProject();     // Execute the original program to obtain reference data
            await this.mutationAnalysis();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), []];
        } else {
            console.log("Testing Single Project");
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
        console.log("Minimising Test Suite....");
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            test.determineCoveredObjectives([...this.statementMap.values()]);
        }
        this.testCases.sort((a, b) => b.coveredStatements - a.coveredStatements);
        let coverage = 0;
        const shortenedTestCases = [];
        for (const test of this.testCases) {
            await this.executeTestCase(test, false);
            test.currentActivationTrace = undefined;
            test.currentUncertainty = new Map<number, number>();
            this.updateArchive(test);
            if ([...this.archive.keys()].length > coverage) {
                coverage = [...this.archive.keys()].length;
                shortenedTestCases.push(test);
            }
            if ([...this.statementMap.keys()].length === [...this.archive.keys()].length) {
                break;
            }
        }
        console.log(`Minimised from ${this.testCases.length} tests to ${shortenedTestCases.length} tests`);
        this.testCases = shortenedTestCases;
        this.archive.clear();
    }

    /**
     * Updates the archive of covered fitness functions.
     * @param network the network with which the archive should be updated.
     */
    protected updateArchive(network: NeatChromosome): void {
        for (const statementKey of this.statementMap.keys()) {
            const fitnessFunction = this.statementMap.get(statementKey);
            const statementFitness = fitnessFunction.getFitness(network);
            if (fitnessFunction.isOptimal(statementFitness) && !this.archive.has(statementKey)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this.archive.set(statementKey, network);
            }
        }
    }

    /**
     * Extracts the results of an executed test case and saves them within the StatisticsCollector.
     * @param testCase the testCase whose results should be extracted.
     */
    protected extractNetworkStatistics(testCase: NeatChromosome): void {
        // We can only apply node activation analysis if we have a reference trace
        if (testCase.referenceActivationTrace) {
            const nodeSA = SurpriseAdequacy.LSANodeBased(testCase.referenceActivationTrace, testCase.currentActivationTrace);
            testCase.surpriseAdequacyNodes = nodeSA[0];

            // If the program could not be executed we set all nodes as being suspicious
            if (nodeSA[1] === undefined) {
                testCase.surpriseCount = testCase.referenceActivationTrace.tracedNodes.length;
            } else {
                const surpriseActivations = this.countSuspiciousActivations(nodeSA[2]);
                testCase.surpriseCount = surpriseActivations[0];
            }
        } else {
            testCase.surpriseAdequacyNodes = undefined;
            testCase.surpriseCount = undefined;
        }
    }

    /**
     * Saves the observed test execution statistics to later return them as a csv file.
     * @param testCases the executed testCases holding the execution results.
     * @param projectName the name of the executed project.
     * @param testName the name of the executed test file.
     * @param mutantDetection determines whether we do mutation analysis.
     */
    protected updateTestStatistics(testCases: readonly NeatChromosome[], projectName: Readonly<string>,
                                   testName: Readonly<string>, mutantDetection = false): void {
        // TODO Move to a NetworkAnalysis class...
        for (let i = 0; i < testCases.length; i++) {
            const test = testCases[i];
            test.determineCoveredObjectives([...this.statementMap.values()]);
            const currentUncertainty = [...test.currentUncertainty.values()];
            const averageUncertainty = currentUncertainty.reduce((pv, cv) => pv + cv, 0) / currentUncertainty.length;
            const isMutant = this.isMutant(test, this.testCases[i]);

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
                surpriseNodeAdequacy: test.surpriseAdequacyNodes,
                surpriseCount: test.surpriseCount,
                avgUncertainty: averageUncertainty,
                isMutant: isMutant
            };
            StatisticsCollector.getInstance().addNetworkSuiteResult(testResult);
        }
    }

    /**
     * Determines whether the given test was executed on a mutant.
     * @param executedTest the network that just got executed on a Scratch program.
     * @param originalTest the original network from which the executed one got cloned off.
     * @returns true if we suspect a mutant.
     */
    public isMutant(executedTest: Readonly<NetworkChromosome>, originalTest: Readonly<NetworkChromosome>): boolean {
        // If the network structure has changed within the output nodes, we have found new events suggesting that
        // something has been mutated within the controls of the program.
        const execClassNodes = executedTest.outputNodes.filter(node => node instanceof ClassificationNode) as ClassificationNode[];
        const execEvents = execClassNodes.map(node => node.event.stringIdentifier());
        const originalClassNodes = originalTest.outputNodes.filter(node => node instanceof ClassificationNode) as ClassificationNode[];
        const originalEvents = originalClassNodes.map(node => node.event.stringIdentifier());
        const newEvents = execEvents.filter(eventString => !originalEvents.includes(eventString));
        if (newEvents.length > 0) {
            for (const newEvent of newEvents) {
                console.log(`New Event ${newEvent}`);
            }
            return true;
        }

        // If we encounter surprising node activations we suspect a mutant.
        if (executedTest.surpriseCount > 0) {
            console.log(`Surprising node activation count of ${executedTest.surpriseCount}`);
            return true;
        }
        return false;
    }

    /**
     * Counts the number of suspicious node activations.
     * @param surpriseMap maps executed Scratch-Steps to obtained LSA values of input nodes.
     * @returns number indicating how often a surprising activations was encountered.
     */
    protected countSuspiciousActivations(surpriseMap: Map<number, Map<string, boolean>>): [number, Map<string, number>] {
        let surpriseCounter = 0;
        const nodeSurpriseMap = new Map<string, number>();
        for (const stepTrace of surpriseMap.values()) {
            for (const [node, surprise] of stepTrace.entries()) {
                if (!nodeSurpriseMap.has(node)) {
                    nodeSurpriseMap.set(node, 0);
                }
                if (surprise) {
                    surpriseCounter++;
                    nodeSurpriseMap.set(node, nodeSurpriseMap.get(node) + 1);
                }
            }
        }
        return [surpriseCounter, nodeSurpriseMap];
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
