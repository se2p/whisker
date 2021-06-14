import {Chromosome} from "../../Chromosome";

/**
 * LocalSearch implementations are plugged into a SearchAlgorithm and help improve chromosomes according to a
 * predefined fitness function by modifying the given chromosome in place.
 *
 * @param <C> the type of chromosomes supported by this LocalSearch operator
 */
export interface LocalSearch<C extends Chromosome> {

    /**
     * Applies local search to the specified chromosome.
     * @param chromosome the chromosome that should be modified by local search
     * @returns the modified chromosome wrapped in a Promise
     */
    apply(chromosome: C): Promise<C>;

    /**
     * Determines whether local search can be applied to this chromosome
     * @param chromosome the chromosome local search should be applied to
     * @param depletedResourceThreshold determines the amount of depleted resources after which local search will be applied
     * @return boolean whether the local search operator can be applied to the given chromosome.
     */
    isApplicable(chromosome: C, depletedResourceThreshold:number): boolean;

    /**
     * Determines whether the local search operator improved the original chromosome. If this is the case, the modified
     * chromosome should replace the original chromosome.
     * @param originalChromosome the chromosome local search is applied to
     * @param modifiedChromosome the resulting chromosome after local search has been applied to the original
     * @return boolean whether the local search operator improved the original chromosome.
     */
    hasImproved(originalChromosome: C, modifiedChromosome: C): boolean
}
