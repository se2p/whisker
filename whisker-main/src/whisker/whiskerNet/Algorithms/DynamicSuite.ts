import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";

export class DynamicSuite {

    public async execute (savedNetworks: string, vm: VirtualMachine): Promise<void>{
        const eventExtractor = new NeuroevolutionScratchEventExtractor(vm);
        const networkLoader = new NetworkLoader(savedNetworks, eventExtractor.extractStaticEvents(vm));
        console.log(networkLoader.loadNetwork())
    }

}

