import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import WhiskerUtil from "../../../test/whisker-util";
import {ScratchProject} from "../../scratch/ScratchProject";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {SurpriseAdequacy} from "../Misc/SurpriseAdequacy";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NEAT} from "./NEAT";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {FitnessFunction} from "../../search/FitnessFunction";
import {DynamicSuiteParameter} from "../HyperParameter/DynamicSuiteParameter";

export class DynamicSuite {

    private _statementMap: Map<number, FitnessFunction<NeatChromosome>>;
    private _archive = new Map<number, NetworkChromosome>();

    public async execute(vm: VirtualMachine, project: ScratchProject, projectName: string, testFile: string,
                         properties: Record<string, number>): Promise<string> {

        const util = new WhiskerUtil(vm, project);
        const vmWrapper = util.getVMWrapper();

        // Check if a seed has been set.
        const seedString = properties.seed.toString();
        if (seedString !== 'undefined' && seedString !== "") {
            Randomness.setInitialSeeds(properties.seed);
        }
        // If not set a random seed.
        else {
            Randomness.setInitialSeeds(Date.now());
        }

        const testJSON = JSON.parse(testFile);
        const config = new WhiskerSearchConfiguration(testJSON['Configs']);
        const parameter = config.dynamicSuiteParameter;
        parameter.train = properties['train'] == 1;
        parameter.train = false

        Container.vm = vm;
        Container.vmWrapper = vmWrapper;
        Container.config = config;
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = properties['acceleration'];
        this.initialiseFitnessTargets();

        StatisticsCollector.getInstance().projectName = projectName;

        await util.prepare(properties['acceleration'] || 1);
        util.start();

        // Load the saved networks from the test file.
        const eventExtractor = new NeuroevolutionScratchEventExtractor(vm);
        const networkLoader = new NetworkLoader(testJSON['Networks'], eventExtractor.extractStaticEvents(vm));
        let networks = networkLoader.loadNetworks();

        // Re-train the loaded networks on the given project.
        if (parameter.train) {
            const neat = new NEAT();
            const neatParameter = this.setTrainParameter(parameter, neat);
            networks = await neat.train(networks, neatParameter);
        }

        // Execute the dynamic suite.
        for (const network of networks) {
            network.recordActivationTrace = true;
            await parameter.networkFitness.getFitness(network, parameter.timeout, parameter.eventSelection);
            this.updateArchive(network);
            if (network.savedActivationTrace) {
                network.surpriseAdequacyStep = SurpriseAdequacy.LSA(network.savedActivationTrace, network.currentActivationTrace);
                const nodeSA = SurpriseAdequacy.LSANodeBased(network.savedActivationTrace, network.currentActivationTrace);
                network.surpriseAdequacyNodes = nodeSA[0];
                network.surpriseCounterNormalised = DynamicSuite.getNumberOfSurprises(nodeSA[1]) / nodeSA[1].size;
                const z =  SurpriseAdequacy.zScore(network.savedActivationTrace, network.currentActivationTrace);
                network.zScore = z[0];
                console.log(z[1]);
            }
            StatisticsCollector.getInstance().networks.push(network);
        }
        const csvOutput = StatisticsCollector.getInstance().asCsvDynamicSuite();
        console.log(csvOutput)
        return csvOutput;
    }

    private static getNumberOfSurprises(surpriseMap: Map<number, Map<string, boolean>>): number {
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

    private initialiseFitnessTargets() {
        this._statementMap = new Map<number, FitnessFunction<NeatChromosome>>();
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(Container.vm, []);
        for (let i = 0; i < fitnessTargets.length; i++) {
            this._statementMap.set(i, fitnessTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessTargets.length;
    }

    private updateArchive(network: NeatChromosome) {
        for (const statementKey of this._statementMap.keys()) {
            const fitnessFunction = this._statementMap.get(statementKey);
            const statementFitness = fitnessFunction.getFitness(network);
            if (fitnessFunction.isOptimal(statementFitness) && !this._archive.has(statementKey)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this._archive.set(statementKey, network);
            }
        }
    }

    private setTrainParameter(parameter: DynamicSuiteParameter, neat: NEAT) {
        neat.setFitnessFunctions(this._statementMap);
        const neatParameter = new NeatProperties();
        neatParameter.populationType = 'train';
        neatParameter.populationSize = parameter.trainPopulationSize;
        neatParameter.timeout = parameter.timeout;
        neatParameter.networkFitness = parameter.networkFitness;
        neatParameter.stoppingCondition = parameter.trainStoppingCondition;
        return neatParameter;
    }

}

