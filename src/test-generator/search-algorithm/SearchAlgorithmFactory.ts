import { SearchAlgorithm } from "./SearchAlgorithm";
import { Chromosome } from "../chromosomes/Chromosome";
import { SearchAlgorithmProperties } from "./SearchAlgorithmProperties";

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
    private _searchAlgorithm: SearchAlgorithm<C>;

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
