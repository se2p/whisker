import { Chromosome } from "../chromosomes/chromosome";
import { Pair } from "../util/pair";

/**
 * The crossover operator recombines the genetic material of two given chromosomes.
 * 
 * @param <C> the type of the chromosome supported by this crossover operator
 * @author Sophia Geserer
 */
export interface Crossover<C extends Chromosome<C>> {

    /**
     * Applies crossover to the two given parent chromosomes
     * and returns the resulting pair of chromosomes.
     * @param parent1 the first parent
     * @param parent2 the second parent
     * @returns the offspirng formed by applying crossover to the given parents
     */
    apply(parent1: C, parent2: C): Pair<C>;

    /**
     * Applies crossover to the given pair of parent chromosomes
     * and returns the resulting pair of chromosomes.
     * @param parents the pair of parent chromosomes
     * @returns the offspirng formed by applying crossover to the given parents
     */
    applyToPair(parents: Pair<C>): Pair<C>;

}