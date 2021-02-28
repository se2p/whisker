import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NeatChromosome} from "../NeatChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../NetworkExecutor";


export class SurviveFitness implements NetworkFitnessFunction<NeatChromosome> {

    async getFitness(network: NeatChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        network.networkFitness = network.timePlayed;
        return network.networkFitness;
    }


    getFitnessWithoutPlaying(network: NeatChromosome): number {
        return network.timePlayed;
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }
}
