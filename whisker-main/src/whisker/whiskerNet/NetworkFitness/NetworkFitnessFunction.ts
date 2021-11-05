import {NetworkChromosome} from "../Networks/NetworkChromosome";

/**
 * A NetworkFitness function maps a given network onto a numeric value that represents how good the network is in
 * playing a game.
 */
export interface NetworkFitnessFunction<C extends NetworkChromosome> {
    /**
     * Computes and returns the fitness value for the given network.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the network should be executed (network (default) | random | static
     * events | eventsExtended).
     * @returns Promise<number> the fitness value of the specified network.
     */
    getFitness(network: C, timeout: number, eventSelection?:string): Promise<number>;
}
