import {LocalSearch} from "./LocalSearch";
import {TestChromosome} from "../../../testcase/TestChromosome";

export class ReductionLocalSearch extends LocalSearch<TestChromosome> {

    /**
     * Determines whether ReductionLocalSearch can be applied to this chromosome.
     * This is the case if the chromosome's gene size can be reduced at all and if it has already been executed at
     * least once.
     * @param chromosome the chromosome ReductionLocalSearch should be applied to
     * @return boolean determining whether ReductionLocalSearch can be applied to the given chromosome.
     */
    async isApplicable(chromosome: TestChromosome): Promise<boolean> {
        return chromosome.getGenes().length > 1 && chromosome.getGenes().length > chromosome.lastImprovedCodon &&
            chromosome.lastImprovedTrace !== undefined;
    }

    /**
     *
     * @param chromosome the chromosome being modified by ReductionLocalSearch.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        // Cut off the codons of the chromosome up to the point after which no more blocks have been covered.
        const newCodons = chromosome.getGenes().slice(0, chromosome.lastImprovedCodon);
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = chromosome.lastImprovedTrace;
        newChromosome.coverage = new Set<string>(chromosome.coverage);
        newChromosome.lastImprovedCodon = chromosome.lastImprovedCodon;
        return newChromosome;
    }

    /**
     * ReductionLocalSearch has improved the original Chromosome if the modified chromosome covers at least as much
     * blocks as the original one and if the modified gene size is smaller than the original gene size.
     * @param originalChromosome the chromosome ReductionLocalSearch has been applied to.
     * @param modifiedChromosome the resulting chromosome after ReductionLocalSearch has been applied to the original.
     * @return boolean whether ReductionLocalSearch has improved the original chromosome.
     */
    hasImproved(originalChromosome: TestChromosome, modifiedChromosome: TestChromosome): boolean {
        return originalChromosome.coverage <= modifiedChromosome.coverage &&
            originalChromosome.getGenes().length > modifiedChromosome.getGenes().length;
    }
}
