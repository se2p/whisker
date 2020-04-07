import { Chromosome } from "../chromosomes/chromosome"

/**
 * A fitness function maps a given chromosome onto a numeric value that represents the goodness of
 * the solution encoded by that particular chromosome.
 * 
 * @param <C> the type of the chromosmes rated by this fitness function
 * @author Sophia Geserer
 */
export interface FitnessFunction<C extends Chromosome<C>> {
    
    /**
     * Computes and returns the fitness value for the given chromosome.
     * @param chromosome the chromosome to rate
     * @returns the fitness value of the specified chromosome
     */
    getFitness(chromosome: C): number;

}
