import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NetworkExecutor} from "../NetworkExecutor";
import {NetworkSuite} from "./NetworkSuite";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../../scratch/ScratchInterface";
import {MutationFactory} from "../../scratch/ScratchMutation/MutationFactory";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NetworkAnalysis} from "../Misc/NetworkAnalysis";

export class DynamicSuite extends NetworkSuite {

    /**
     * JSON representation of the dynamic test suite.
     */
    private readonly _testSuiteJSON;

    constructor(project: ArrayBuffer, vm: VirtualMachine, properties: Record<string, number | string | string[]>,
                testFile: string) {
        super(project, vm, properties);
        this._testSuiteJSON = JSON.parse(testFile);
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
            this.updateArchive(test);
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
        this.updateTestStatistics(this.testCases, this.projectName, this.testName);
    }

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected async mutationAnalysis(): Promise<ScratchProgram[]> {
        const mutantFactory = new MutationFactory(this.vm);
        const mutantPrograms = mutantFactory.generateScratchMutations(this.properties.mutators as string[]);
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
            this.updateTestStatistics(executedTests, projectMutation, this.testName);
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

}

