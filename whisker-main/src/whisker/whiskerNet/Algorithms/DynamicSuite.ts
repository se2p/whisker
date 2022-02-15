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
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {TestChromosome} from "../../testcase/TestChromosome";

export class DynamicSuite {

    private _statementMap: Map<number, StatementFitnessFunction>;
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

        Container.vm = vm;
        Container.vmWrapper = vmWrapper;
        Container.config = config;
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = properties['acceleration'];
        this.initialiseFitnessTargets();

        StatisticsCollector.getInstance().projectName = projectName;

        await util.prepare(properties['acceleration'] || 1);
        util.start();

        const eventExtractor = new NeuroevolutionScratchEventExtractor(vm);
        const networkLoader = new NetworkLoader(testJSON['Networks'], eventExtractor.extractStaticEvents(vm));
        const networks = networkLoader.loadNetworks();
        for (const network of networks) {
            network.recordActivationTrace = true;
            await parameter.networkFitness.getFitness(network, parameter.timeout, parameter.eventSelection);
            this.updateArchive(network);
            if (network.savedActivationTrace) {
                network.surpriseAdequacyStep = SurpriseAdequacy.LSA(network.savedActivationTrace, network.currentActivationTrace);
                network.surpriseAdequacyNodes = 0;
            }
            StatisticsCollector.getInstance().networks.push(network);
        }
        const csvOutput = StatisticsCollector.getInstance().asCsvDynamicSuite();
        console.log(csvOutput)
        return csvOutput;
    }

    private initialiseFitnessTargets() {
        this._statementMap = new Map<number, StatementFitnessFunction>();
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(Container.vm, []);
        for (let i = 0; i < fitnessTargets.length; i++) {
            this._statementMap.set(i, fitnessTargets[i]);
        }
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessTargets.length;
    }

    private updateArchive(network: NeatChromosome) {
        for (const statementKey of this._statementMap.keys()) {
            const fitnessFunction = this._statementMap.get(statementKey);
            const statementFitness = fitnessFunction.getFitness(network as unknown as TestChromosome);
            if (fitnessFunction.isOptimal(statementFitness) && !this._archive.has(statementKey)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this._archive.set(statementKey, network);
            }
        }
    }

}

