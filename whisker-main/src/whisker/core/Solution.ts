import {FitnessFunction} from "../search/FitnessFunction";

/**
 * Interface for solutions to optimization problems that get solved by {@link OptimizationAlgorithm}s.
 */
export interface Solution {

    /**
     * Computes and returns the fitness of a solution, i.e., how close the solution is to solving its objective.
     * @param fitnessFunction the fitness function specifying the objective to solve.
     * @param fitnessKey the key mapping the objective function to a cache value,
     * e.g., the coverage objective map used by Neatest.
     * @returns the fitness value of the solution.
     */
    getFitness(fitnessFunction: FitnessFunction<Solution>, fitnessKey?: number): Promise<number>;

}
