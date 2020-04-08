import { List } from "./List";
import { Chromosome } from "../chromosomes/Chromosome";
import { NotYetImplemented } from "../core/exception/NotYetImplemented";

/**
 * A printer to retrieve the data about each run of the search algorithm.
 * 
 * @param <C> the type of the chromosomes of the population that need to be printed out
 * @author Sophia Geserer
 */
export class DataPrinter<C extends Chromosome<C>> {

    /**
     * Returns the achieved coverage of the given population.
     * @param population the population that coverage is needed
     * @returns the achieved coverage of the population
     */
    achievedCoverage(population: List<C>): number {
        throw new NotYetImplemented();
    }

    /**
     * Returns the number of results.
     * @param population the population that size one is interested in
     * @returns the number of results
     */
    resultSize(population: List<C>): number {
        throw new NotYetImplemented();
    }

    /**
     * Prints out the retrieved data.
     */
    print(): void {
        throw new NotYetImplemented();
    }
}
