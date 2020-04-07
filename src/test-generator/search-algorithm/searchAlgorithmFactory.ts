import { SearchAlgorithm } from "./searchAlgorithm";
import { Chromosome } from "../chromosomes/chromosome";
import { SearchAlgorithmProperties } from "./searchAlgorithmProperties";

/**
 * This factory is used to instantiate and configure the search algorithm.
 * 
 * // TODO: not sure about this class
 * 
 * @param <C> the type of chromosomes the factory handles
 * @author Sophia Geserer
 */
export class SearchAlgorithmFactory<C extends Chromosome<C>> {

    /**
     * The search algorithm to be configured.
     */
    private searchAlgorithm: SearchAlgorithm<C>;

    /**
     * Instantiates the search algorithm.
     */
    instantiateSearchAlgorithm(): void {
        console.log('SearchAlgorithmFactory#instantiateSearchAlgorithm not implemented.');
    }

    /**
     * Sets the properties for the search algorithm.
     */
    configureSearchAlgorithm(properties: SearchAlgorithmProperties): void {
        console.log('SearchAlgorithmFactory#configureSearchAlgorithm not implemented.');
    }
}