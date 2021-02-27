import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NeatChromosome} from "../NeatChromosome";
import {NeuroevolutionExecutor} from "../NeuroevolutionExecutor";
import {Container} from "../../utils/Container";


export class SurviveFitness implements NetworkFitnessFunction<NeatChromosome> {

    async getFitness(network: NeatChromosome, timeout: number): Promise<number> {
        const executor = new NeuroevolutionExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        network.networkFitness = network.timePlayed;
        return network.networkFitness;
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

}
