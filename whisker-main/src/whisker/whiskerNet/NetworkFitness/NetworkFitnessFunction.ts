import {NetworkChromosome} from "../NetworkChromosome";

/**
 * A NetworkFitness function maps a given network onto a numeric value that represents how good the network is in playing
 * a game.
 *
 * @param <C> the type of the networks rated by this fitness function
 */
export interface NetworkFitnessFunction<C extends NetworkChromosome> {

    /**
     * Computes and returns the fitness value for the given network.
     * @param network the network to evaluate
     * @param timeout the timeout after which a scratch game during evaluation is terminated.
     * @param eventSelection determines how events should be selected during network evaluation
     * @returns the fitness value of the specified network
     */
    getFitness(network: C, timeout: number, eventSelection?:string): Promise<number>;

    /**
     * Computes and returns the fitness value for the given network without playing the game.
     * @param network the network to evaluate
     * @returns the fitness value of the specified network.
     */
    getFitnessWithoutPlaying(network: C): number;

    /**
     * Comparator for two fitness values:
     * Sorted in descending order
     *
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number;
}
