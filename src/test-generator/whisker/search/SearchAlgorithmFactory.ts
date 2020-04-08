import { SearchAlgorithm } from "./SearchAlgorithm";
import { Chromosome } from "./Chromosome";
import { SearchAlgorithmProperties } from "./SearchAlgorithmProperties";
import { NotYetImplemented } from "../core/exception/NotYetImplemented";

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
        throw new NotYetImplemented();
    }

    /**
     * Sets the properties for the search algorithm.
     */
    configureSearchAlgorithm(properties: SearchAlgorithmProperties): void {
        throw new NotYetImplemented();
    }
}
