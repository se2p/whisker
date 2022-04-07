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
import {ScratchMutation} from "../../scratch/ScratchMutation/ScratchMutation";
import {KeyReplacementMutation} from "../../scratch/ScratchMutation/KeyReplacementMutation";
import {Chromosome} from "../../search/Chromosome";
import {ScratchProgram} from "../../scratch/ScratchInterface";
import {SingleBlockDeletionMutation} from "../../scratch/ScratchMutation/SingleBlockDeletionMutation";
import {
    ArithmeticOperatorReplacementMutation
} from "../../scratch/ScratchMutation/ArithmeticOperatorReplacementMutation";

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
     * The Scratch mutation operators that should be applied.
     */
    protected mutationOperators: ScratchMutation[]

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

        // Record activation traces
        if (this.properties.activationTraceRepetitions > 0) {
            await this.collectActivationTrace();
        }

        if (this.mutationOperators.length == 0) {
            console.log("Testing Single Project");
            await this.testSingleProject();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), []];
        } else {
            console.log("Performing Mutation Analysis");
            const mutantPrograms = await this.mutationAnalysis();
            return [StatisticsCollector.getInstance().asCsvNetworkSuite(), mutantPrograms];
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

        this.mutationOperators = [];
        const specifiedMutators = this.properties.mutators as string[];
        for (const mutator of specifiedMutators) {
            switch (mutator) {
                case 'KRP':
                    this.mutationOperators.push(new KeyReplacementMutation(this.vm));
                    break;
                case 'SBD':
                    this.mutationOperators.push(new SingleBlockDeletionMutation(this.vm));
                    break;
                case 'AOR':
                    this.mutationOperators.push(new ArithmeticOperatorReplacementMutation(this.vm));
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
     * Executes a test for a user-defined amount of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    private async collectActivationTrace(): Promise<void> {
        const repetitions = parseInt(this.properties.activationTraceRepetitions as string);
        const scratchSeeds = Array(repetitions).fill(Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER)).map(
            () => Randomness.getInstance().nextInt(0, Number.MAX_SAFE_INTEGER));
        for (const test of this.testCases) {
            for (const seed of scratchSeeds) {
                Randomness.setScratchSeed(seed);
                await this.executeTestCase(test, false);
            }

            // Save the recorded AT as reference and reset the current AT for the actual test subjects.
            test.referenceActivationTrace = test.currentActivationTrace.clone();
            test.currentActivationTrace = undefined;
        }
        StatisticsCollector.getInstance().numberFitnessEvaluations = 0;
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
            testCase.surpriseAdequacyStep = SurpriseAdequacy.LSA(testCase.referenceActivationTrace, testCase.currentActivationTrace);
            const nodeSA = SurpriseAdequacy.LSANodeBased(testCase.referenceActivationTrace, testCase.currentActivationTrace);
            testCase.surpriseAdequacyNodes = nodeSA[0];

            // If the program could not be executed we set all nodes as being suspicious
            if (nodeSA[1] === undefined) {
                testCase.surpriseCounterNormalised = testCase.referenceActivationTrace.tracedNodes.length;
            } else {
                testCase.surpriseCounterNormalised = this.countSuspiciousActivations(nodeSA[1]) / nodeSA[1].size;
            }
            const z = SurpriseAdequacy.zScore(testCase.referenceActivationTrace, testCase.currentActivationTrace);
            testCase.zScore = z[0];
        }
    }

    /**
     * Saves the observed test execution statistics to later return them as a csv file.
     * @param testCases the executed testCases holding the execution results.
     * @param projectName the name of the executed project.
     * @param testName the name of the executed test file.
     */
    protected updateTestStatistics(testCases: readonly NeatChromosome[], projectName: Readonly<string>,
                                   testName: Readonly<string>): void {
        for (const test of testCases) {
            test.determineCoveredObjectives([...this.statementMap.values()]);
            const uncertaintyValues = [...test.uncertainty.values()];
            const uncertainty = uncertaintyValues.reduce((pv, cv) => pv + cv, 0) / uncertaintyValues.length;
            const testResult: NetworkTestSuiteResults = {
                projectName: projectName,
                testName: testName,
                totalObjectives: [...this.statementMap.keys()].length,
                coveredObjectivesByTest: test.coveredStatements,
                coveredObjectivesBySuite: [...this.archive.keys()].length,
                score: test.score,
                playTime: test.playTime,
                surpriseStepAdequacy: test.surpriseAdequacyStep,
                surpriseNodeAdequacy: test.surpriseAdequacyNodes,
                surpriseCount: test.surpriseCounterNormalised,
                zScore: test.zScore,
                uncertainty: uncertainty
            };
            StatisticsCollector.getInstance().addNetworkSuiteResult(testResult);
        }

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
    protected getScratchMutations(): ScratchProgram[] {
        const mutantPrograms: ScratchProgram[] = [];
        for (const mutator of this.mutationOperators) {
            mutantPrograms.push(...mutator.generateMutants());
        }
        return mutantPrograms;
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
