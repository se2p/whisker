import { Chromosome } from "../chromosomes/Chromosome";
import { List } from "../util/List";

/**
 * The selection operator is responsible for determining which chromosomes should be subjected to
 * mutation and crossover.
 * 
 * @param <C> the type of chromosomes this selection function is compatible with
 * @author Sophia Geserer
 */
export interface Selection<C extends Chromosome<C>> {

    /**
     * Selects a chromosome from the given population and returns the result.
     * @param population the population of chromosomes from which to select
     * @returns the selected chromosome
     */
    apply(population: List<C>): C;

}
