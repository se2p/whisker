import {NetworkChromosome} from "../NetworkChromosome";

/**
 * A fitness function maps a given network onto a numeric value that represents how good the network is in playing
 * a game.
 *
 * @param <C> the type of the networks rated by this fitness function
 */
export interface NetworkFitnessFunction<C extends NetworkChromosome> {

    /**
     * Computes and returns the fitness value for the given network.
     * @param network the network to evaluate
     * @param timeout the timeout after which a scratch game during evaluation is terminated.
     * @returns the fitness value of the specified network
     */
    getFitness(network: C, timeout: number): Promise<number>;

    /**
     * Computes the fitness of a randomised selection of events
     * @param network the network to evaluate
     * @param timeout the timeout after which a scratch game during evaluation is terminated.
     * @returns the fitness value of the specified network choosing random events
     */
    getRandomFitness(network: C, timeout: number):Promise<number>;

    /**
     * Computes and returns the fitness value for the given network without playing the game.
     * @param network the network to evaluate
     * @returns the fitness value of the specified network.
     */
    getFitnessWithoutPlaying(network: C): number;


    /**
     * Comparator for two fitness values:
     *
     * We are sorting ascending, from bad fitness to better fitness
     *
     * Return greater than 0 if value2 is better than value1
     * Return 0 if value1 equals value2
     * Return less than 0 if value2 is worse than value1
     *
     * @param value1 first fitness value
     * @param value2 second fitness value
     */
    compare(value1: number, value2: number): number;
}
