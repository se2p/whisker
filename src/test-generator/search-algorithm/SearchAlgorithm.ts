import { List } from "../util/List";
import { Chromosome } from "../chromosomes/Chromosome";
import { SearchAlgorithmProperties } from "./SearchAlgorithmProperties";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 * 
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export interface SearchAlgorithm<C extends Chromosome<C>> {

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    findSolution(): List<C>;

    /**
     * Sets the properties for this search algorithm.
     * @param properties the properties for the search algorithm
     */
    setProperties(properties: SearchAlgorithmProperties): void;
}
