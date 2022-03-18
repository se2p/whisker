import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {ScratchProject} from "../../scratch/ScratchProject";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NEAT} from "./NEAT";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {NetworkSuiteParameter} from "../HyperParameter/NetworkSuiteParameter";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NetworkExecutor} from "../NetworkExecutor";
import {NetworkSuite} from "./NetworkSuite";

export class DynamicSuite extends NetworkSuite {

    /**
     * JSON representation of the dynamic test suite.
     */
    private readonly _testSuiteJSON;

    constructor(project: ScratchProject, vm: VirtualMachine, properties: Record<string, number | string>,
                testFile: string) {
        super(project, vm, properties);
        this._testSuiteJSON = JSON.parse(testFile);
    }

    /**
     * Executes the dynamic test suite of networks.
     */
    protected async executeTestCases(): Promise<void> {
        let networks = this.loadTestCases();
        if (this.parameter.train) {
            networks = await this.trainNetworks(networks);
        }
        for (const network of networks) {
            network.recordActivationTrace = true;
            await this.executor.execute(network);
            this.executor.resetState();
            this.updateArchive(network);
            if (network.savedActivationTrace) {
                this.extractTestCaseResults(network);
            }
        }
    }

    /**
     * Initialises the used parameter for test execution.
     */
    protected initialiseExecutionParameter(): void {
        const config = new WhiskerSearchConfiguration(this._testSuiteJSON['Configs']);
        this.parameter = config.dynamicSuiteParameter;
        //this.parameter.train = this.properties['train'] == 1;
        this.parameter.train = false;
        this.executor = new NetworkExecutor(Container.vmWrapper, this.parameter.timeout, 'activation');
        Container.config = config;
    }

    /**
     * Loads the dynamic test cases.
     */
    protected loadTestCases(): NeatChromosome[] {
        const fitnessTargets = [...this.statementMap.values()] as unknown as StatementFitnessFunction[];
        const eventExtractor = new NeuroevolutionScratchEventExtractor(this.vm);
        const networkLoader = new NetworkLoader(this._testSuiteJSON['Networks'],
            eventExtractor.extractStaticEvents(this.vm), fitnessTargets);
        return networkLoader.loadNetworks();
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

