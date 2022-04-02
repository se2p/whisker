import {FitnessFunction} from "../../search/FitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Randomness} from "../../utils/Randomness";
import WhiskerUtil from "../../../test/whisker-util";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {Container} from "../../utils/Container";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NetworkSuiteParameter} from "../HyperParameter/NetworkSuiteParameter";
import {SurpriseAdequacy} from "../Misc/SurpriseAdequacy";
import {NetworkExecutor} from "../NetworkExecutor";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {Mutator} from "../../scratch/ScratchMutation/Mutator";
import {KeyOptionMutator} from "../../scratch/ScratchMutation/KeyOptionMutator";
import {Chromosome} from "../../search/Chromosome";

export abstract class NetworkSuite {

    /**
     * Maps a number as fitness function key to a fitness function.
     */
    protected statementMap = new Map<number, FitnessFunction<Chromosome>>();

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
     * The Scratch mutation operators that should be applied.
     */
    protected mutationOperators: Mutator[]

    /**
     * The name of the tested project.
     */
    protected projectName: string

    /**
     * The name of the executed test.
     */
    protected testName: string

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
     * @param projectName the name of the project on which the given test will be executed.
     * @param testName the name of the test case that is about to be executed.
     */
    protected abstract executeTestCase(test: NeatChromosome, projectName: string, testName: string): Promise<void>;

    /**
     * Tests a single project by executing the given test suite.
     */
    protected abstract testSingleProject(): Promise<void>;

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected abstract mutationAnalysis(): Promise<void>;

    /**
     * Executes the given network suite by fist initialising required fields and then executing the respective test
     * cases on the original project or the created mutants.
     */
    protected async execute(): Promise<string> {
        this.setScratchSeed();
        await this.initialiseCommonVariables();
        this.initialiseExecutionParameter();
        this.initialiseFitnessTargets();
        if (this.mutationOperators.length == 0) {
            console.log("Testing Single Project");
            await this.testSingleProject();
        } else {
            console.log("Performing Mutation Analysis");
            await this.mutationAnalysis();
        }
        return StatisticsCollector.getInstance().asCsvNetworkSuite();
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

        this.mutationOperators = [];
        const specifiedMutators = this.properties.mutators as string[];
        for (const mutator of specifiedMutators) {
            switch (mutator) {
                case 'Key':
                    this.mutationOperators.push(new KeyOptionMutator(this.vm));
                    break;
            }
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
        }
    }

    /**
     * Initialises the statement map.
     */
    private initialiseFitnessTargets(): void {
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(Container.vm, []);
        for (let i = 0; i < fitnessTargets.length; i++) {
            this.statementMap.set(i, fitnessTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessTargets.length;
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
     * @param projectName the name of the executed test project
     * @param testName the name of the executed test
     * @param testCase the testCase whose results should be extracted.
     */
    protected extractTestCaseResults(testCase: NeatChromosome, projectName: string, testName: string): void {
        testCase.determineCoveredObjectives([...this.statementMap.values()]);
        testCase.surpriseAdequacyStep = SurpriseAdequacy.LSA(testCase.savedActivationTrace, testCase.currentActivationTrace);
        const nodeSA = SurpriseAdequacy.LSANodeBased(testCase.savedActivationTrace, testCase.currentActivationTrace);
        testCase.surpriseAdequacyNodes = nodeSA[0];

        // If the program could not be executed we set all nodes as being suspicious
        if (nodeSA[1] === undefined) {
            testCase.surpriseCounterNormalised = testCase.savedActivationTrace.tracedNodes.length;
        } else {
            testCase.surpriseCounterNormalised = this.countSuspiciousActivations(nodeSA[1]) / nodeSA[1].size;
        }
        const z = SurpriseAdequacy.zScore(testCase.savedActivationTrace, testCase.currentActivationTrace);
        testCase.zScore = z[0];
        StatisticsCollector.getInstance().addNetworkSuiteResult(projectName, testName, testCase);
    }

    /**
     * Counts the number of suspicious node activations.
     * @param surpriseMap maps executed Scratch-Steps to obtained LSA values of input nodes.
     * @returns number indicating how often a surprising activations was encountered.
     */
    protected countSuspiciousActivations(surpriseMap: Map<number, Map<string, boolean>>): number {
        let surpriseCounter = 0;
        for (const stepTrace of surpriseMap.values()) {
            for (const surprise of stepTrace.values()) {
                if (surprise) {
                    surpriseCounter++;
                }
            }
        }
        return surpriseCounter;
    }

    /**
     * Generates Scratch mutants based on the specified mutation operators.
     * @returns an array of the created mutants.
     */
    protected getScratchMutations(): Record<string, unknown>[] {
        const mutants = [];
        for (const mutator of this.mutationOperators) {
            for (const generatedMutants of mutator.generateMutants()) {
                mutants.push(generatedMutants);
            }
        }
        return mutants;
    }

    /**
     * Loads a given Scratch mutant by initialising the VmWrapper and the NetworkExecutor with the mutant.
     * @param mutant a mutant of a Scratch project.
     */
    protected async loadMutant(mutant: Record<string, unknown>): Promise<void> {
        const util = new WhiskerUtil(this.vm, mutant);
        await util.prepare(this.properties['acceleration'] as number || 1);
        const vmWrapper = util.getVMWrapper();
        this.executor = new NetworkExecutor(vmWrapper, this.parameter.timeout, 'activation', false);
    }
}
