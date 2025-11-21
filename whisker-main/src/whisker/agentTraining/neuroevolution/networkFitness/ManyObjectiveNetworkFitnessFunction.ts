import {NetworkChromosome} from "../networks/NetworkChromosome";
import {ClassificationType, NeuroevolutionEventSelection} from "../hyperparameter/BasicNeuroevolutionParameter";
import {NetworkFitnessFunction} from "./NetworkFitnessFunction";

/**
 * A networkFitness function maps a given network onto a numeric value that represents how good the network is in
 * playing a game.
 */
export interface ManyObjectiveNetworkFitnessFunction<T extends NetworkChromosome> extends NetworkFitnessFunction<T> {

    /**
     * Executes the network and calculates the fitness values for all open statement targets.
     *
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @param classificationType defines how the networks select events.
     */
    calculateFitness(network: T, timeout: number, eventSelection: NeuroevolutionEventSelection,
                     classificationType: ClassificationType): Promise<void>;


    /**
     * Compares two fitness values.
     * A greater fitness is preferred.
     *
     * @param fitness1 First fitness value.
     * @param fitness2 Second fitness value.
     * @return a positive value if fitness1 is better than fitness2,
     * a negative value if fitness1 is worse than fitness2, and 0 if they are equal.
     */
    compare(fitness1: number, fitness2: number): number;

    /**
     * Returns whether the given fitness if optimal.
     *
     * @param fitness the fitness to check.
     * @return if the fitness is optimal.
     */
    isOptimal(fitness: number): boolean;
}
