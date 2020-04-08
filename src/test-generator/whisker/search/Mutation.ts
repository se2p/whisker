import { Chromosome } from "./Chromosome";

/**
 * Mutation introduces new genetic material to create a offspring by modifying the parent chromosome.
 * 
 * @param <C> the type of chromosomes supported by this mutation operator
 * @author Sophia Geserer
 */
export interface Mutation<C extends Chromosome<C>> {

    /**
     * Applies mutation to the specified chromosome and returns the resulting offspring.
     * @param chromosome the parent chromosome to modify by mutation
     * @returns the offspring fromed by mutating the parent
     */
    apply(chromosome: C): C;

}
