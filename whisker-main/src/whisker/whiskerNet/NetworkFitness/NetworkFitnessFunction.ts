import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";

/**
 * A NetworkFitness function maps a given network onto a numeric value that represents how good the network is in
 * playing a game.
 */
export interface NetworkFitnessFunction<T extends NetworkChromosome> {
    /**
     * Computes and returns the fitness value for the given network.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the fitness value of the specified network.
     */
    getFitness(network: T, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number>;
}
