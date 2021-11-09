import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";
import {Container} from "../../utils/Container";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {SurviveFitness} from "./SurviveFitness";

export class CombinedNetworkFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * The networkFitnessFunctions we want to combine
     */
    private readonly _fitnessFunctions: NetworkFitnessFunction<NetworkChromosome>[] = [];

    /**
     * Constructs a new CombinedNetworkFitness object
     * @param fitnessFunctions the networkFitnessFunctions we want to combine
     */
    constructor(...fitnessFunctions: NetworkFitnessFunction<NetworkChromosome>[]) {
        this._fitnessFunctions.push(...fitnessFunctions);
    }

    /**
     * Calculates the combinedFitness score of the specified fitness functions
     * @param network the network to evaluate
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const fitness = this.calculateCombinedFitness(network, start);
        network.networkFitness = fitness;
        executor.resetState();
        return Promise.resolve(fitness);
    }

    /**
     * There is no reason for using this in CombinedNetworkFitness. Here to satisfy interface implementation.
     */
    getFitnessWithoutPlaying(): number {
        throw new NotSupportedFunctionException();
    }

    /**
     * Compares two fitness values -> Higher values are better.
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    /**
     * Calculates the combined fitness values of the specified networkFitnessFunctions by summing them up.
     * @param network the network to evaluate
     * @param start the start time of the playthrough; needed if we evaluate surviveFitness
     */
    // TODO: Add the option to weight the specified networkFitnessFunctions differently
    private calculateCombinedFitness(network: NetworkChromosome, start: number): number {
        const surviveTime = Math.round((Container.vm.runtime.currentMSecs - start) / 100);
        let fitness = 0.00;
        for (const fitnessFunction of this._fitnessFunctions) {
            if (fitnessFunction instanceof SurviveFitness)
                fitness += surviveTime;
            else {
                // Do not play the game again; Due to randomness included in the game we could get other results!
                fitness += fitnessFunction.getFitnessWithoutPlaying(network);
            }
        }
        return fitness;
    }

}
