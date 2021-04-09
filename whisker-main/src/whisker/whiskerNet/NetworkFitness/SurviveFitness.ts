import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../NetworkExecutor";

export class SurviveFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates the survived time.
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const surviveTime = Math.round((Container.vm.runtime.currentMSecs - start) / 100);
        network.networkFitness = surviveTime;
        return surviveTime;
    }

    /**
     * Calculates the survived time of a random event selection playthrough
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
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
    getFitnessWithoutPlaying(): number {
        return 0.0;
    }

    /**
     * Compares two fitness values -> Higher values are better.
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }
}
