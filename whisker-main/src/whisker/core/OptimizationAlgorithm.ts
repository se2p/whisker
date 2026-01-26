import {Chromosome} from "../search/Chromosome";
import {SearchAlgorithmProperties} from "../search/SearchAlgorithmProperties";
import {BasicNeuroevolutionParameter} from "../agentTraining/neuroevolution/hyperparameter/BasicNeuroevolutionParameter";
import {RLHyperparameter} from "../agentTraining/reinforcementLearning/hyperparameter/RLHyperparameter";
import {FitnessFunction} from "../search/FitnessFunction";
import {Solution} from "./Solution";

export interface OptimizationAlgorithm<S extends Solution> {

    /**
     * Returns a list of possible admissible solutions for the given optimization problem.
     * @returns Solution for the given problem
     */
    findSolution(): Promise<Map<number, S>>;

    /**
     * Get starting time of Algorithm
     * @returns startTime of Algorithm in ms.
     */
    getStartTime(): number;

    /**
     * Returns all fitness functions to be solved for this optimization algorithm.
     * @return list with all fitness functions.
     */
    getFitnessFunctions(): Iterable<FitnessFunction<S>>;

    /**
     * Sets the mapping between fitness function keys and fitness functions.
     * @param fitnessFunctions the mapping of fitness functions.
     */
    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<S>>): void;

    /**
     * Returns the solutions found throughout the optimization process.
     * @returns Solution for the given problem
     */
    getCurrentSolution(): S[];
}

export type Hyperparameter =
    | SearchAlgorithmProperties<Chromosome>
    | RLHyperparameter
    | BasicNeuroevolutionParameter
    ;
