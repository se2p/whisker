import { Chromosome } from "./chromosome"

/**
 * A generator for random chromosomes.
 * 
 * @param <C> the type of the chromosomes this generator is able to produce
 * @author Sophia Geserer
 */
export interface ChromosomeGenerator<C extends Chromosome<C>> {
    /**
     * Creates and returns a random chromosome.
     * @returns a random chromosome
     */
    get(): C;
}