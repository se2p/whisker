import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../NetworkExecutor";


export class SurviveFitness implements NetworkFitnessFunction<NetworkChromosome> {

    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const surviveTime = Math.round((Container.vm.runtime.currentMSecs - start) / 100);
        network.networkFitness = surviveTime;
        return surviveTime;
    }

    async getRandomFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.executeRandom(network);
        // Round due to small variances in runtime
        const surviveTime = Math.round((Container.vm.runtime.currentMSecs - start) / 100);
        network.networkFitness = surviveTime;
        return surviveTime;
    }

    /**
     * Used for CombinedNetworkFitness.
     * Value is calculated within CombinedNetworkFitness, hence returns 0.0
     */
    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        return 0.0;
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }
}
