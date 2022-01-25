import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import WhiskerUtil from "../../../test/whisker-util";
import {ScratchProject} from "../../scratch/ScratchProject";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {SurpriseAdequacy} from "../Misc/SurpriseAdequacy";
import {Randomness} from "../../utils/Randomness";

export class DynamicSuite {

    public async execute (vm: VirtualMachine, project: ScratchProject, testFile:string,
                          properties: Record<string, number>): Promise<boolean>{

        const util = new WhiskerUtil(vm, project);
        const vmWrapper = util.getVMWrapper();

        // Check if a seed has been set.
        const seedString = properties.seed.toString();
        if(seedString !== 'undefined' && seedString !== "") {
            Randomness.setInitialSeeds(properties.seed);
        }
        // If not set a random seed.
        else{
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

        await util.prepare(properties['acceleration'] || 1);
        util.start();

        const eventExtractor = new NeuroevolutionScratchEventExtractor(vm);
        const networkLoader = new NetworkLoader(testJSON['Networks'], eventExtractor.extractStaticEvents(vm));
        const networks = networkLoader.loadNetworks();
        const sa = new Map<string, number>();

        return true;
    }

}

