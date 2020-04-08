import { ChromosomeGenerator } from "./ChromosomeGenerator"
import { Chromosome } from "./Chromosome"
import { List } from "../util/List"
import { NotYetImplemented } from "../core/exception/NotYetImplemented";

/**
 * A factory for populations of genetic algorithms.
 * 
 * @author Sophia Geserer
 */
export class PopulationFactory  {

    private constructor() {
    }

    /**
     * Generates a new population of the specified size using the supplied generator to create
     * population individuals.
     * @param generator the generator used to create random chromosomes
     * @param size the number of chromosomes in the population
     * @returns the resultion population of chromosomes
    */
    static generate<C extends Chromosome<C>>(generator: ChromosomeGenerator<C>, size: number): List<C> {
        throw new NotYetImplemented();
    }
}
