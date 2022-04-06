import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NEAT} from "./NEAT";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {NetworkSuiteParameter} from "../HyperParameter/NetworkSuiteParameter";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NetworkExecutor} from "../NetworkExecutor";
import {NetworkSuite} from "./NetworkSuite";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../../scratch/ScratchInterface";

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
        this.parameter.train = false;
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
     * @param projectName the name of the project on which the given test will be executed.
     * @param testName the name of the dynamic test case that is about to be executed.
     * @param recordExecution determines whether we want to record this execution by updating the archive and the
     * test execution statistics
     */
    protected async executeTestCase(test: NeatChromosome, projectName: string, testName: string, recordExecution: boolean): Promise<void> {
        test.recordActivationTrace = true;
        await this.executor.execute(test);
        if (recordExecution) {
            this.updateArchive(test);
            this.extractTestCaseResults(test, projectName, testName);
        }
        test.recordActivationTrace = false;
        this.executor.resetState();
    }

    /**
     * Executes the dynamic test suite consisting of networks on a single test project.
     */
    protected async testSingleProject(): Promise<void> {
        // Since we are using dynamic suites we have the option to re-train them.
        if (this.parameter.train) {
            this.testCases = await this.trainNetworks(this.testCases);
        }

        // Execute all networks on the single project.
        for (const network of this.testCases) {
            await this.executeTestCase(network, this.projectName, this.testName, true);
        }
    }

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected async mutationAnalysis(): Promise<ScratchProgram[]> {
        const mutantPrograms = this.getScratchMutations();
        console.log(`Produced mutants ${mutantPrograms.length}`);
        for (const mutant of mutantPrograms) {
            const projectMutation = `${this.projectName}-${mutant.name}`;
            console.log(`Analysing mutant ${projectMutation}`);
            try {
                for (const network of this.testCases) {
                    // We clone the network since it might get changed due to specific mutations.
                    const networkClone = network.clone();
                    await this.loadMutant(mutant);
                    await this.executeTestCase(networkClone, projectMutation, this.testName, true);
                }
            }
            catch (e) {
                console.error(e);
                console.log(`Defect mutant: ${projectMutation}`);
            }
        }
        return mutantPrograms;
    }

    /**
     * Re-trains the saved networks in the test suite on the obtained project.
     * @param networks saved networks in the dynamic test suite.
     * @returns Promise<NeatChromosome[]> the list of retrained networks.
     */
    private async trainNetworks(networks: NeatChromosome[]): Promise<NeatChromosome[]> {
        const neat = new NEAT();
        const neatParameter = this.setTrainParameter(this.parameter, neat);
        return await neat.train(networks, neatParameter);
    }

    /**
     * Sets parameter which are required for re-training the networks in the dynamic test suite.
     * @param parameter the saved hyperparameter
     * @param neat instance of the NEAT algorithm, used for re-training the networks
     * @returns NeatProperties hyperparameter used for re-training the networks.
     */
    private setTrainParameter(parameter: NetworkSuiteParameter, neat: NEAT): NeatProperties {
        neat.setFitnessFunctions(this.statementMap);
        const neatParameter = new NeatProperties();
        neatParameter.populationType = 'train';
        neatParameter.populationSize = parameter.trainPopulationSize;
        neatParameter.timeout = parameter.timeout;
        neatParameter.networkFitness = parameter.networkFitness;
        neatParameter.stoppingCondition = parameter.trainStoppingCondition;
        return neatParameter;
    }

}

