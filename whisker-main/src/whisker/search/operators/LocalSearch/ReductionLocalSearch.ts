import {LocalSearch} from "./LocalSearch";
import {TestChromosome} from "../../../testcase/TestChromosome";

export class ReductionLocalSearch extends LocalSearch<TestChromosome> {

    /**
     * Collects the chromosomes, ReductionLocalSearch has already been applied upon. This helps us to prevent
     * wasting time on applying ReductionLocalSearch on the same chromosome twice.
     */
    private readonly _originalChromosomes: TestChromosome[] = [];

    /**
     * Determines whether ReductionLocalSearch can be applied to this chromosome.
     * This is the case if the chromosome's gene size can be reduced at all
     * and if we did not apply ReductionLocalSearch on this chromosome before.
     * @param chromosome the chromosome ReductionLocalSearch should be applied to
     * @return boolean determining whether ReductionLocalSearch can be applied to the given chromosome.
     */
    isApplicable(chromosome: TestChromosome): boolean {
        return chromosome.getGenes().size() > 1 && chromosome.getGenes().size() > chromosome.lastImprovedCoverageCodon &&
            chromosome.lastImprovedTrace !== undefined && this._originalChromosomes.indexOf(chromosome) < 0;
    }

    /**
     *
     * @param chromosome the chromosome being modified by ReductionLocalSearch.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        this._originalChromosomes.push(chromosome);
        // Cut off the codons of the chromosome up to the point after which no more blocks have been covered.
        const newCodons = chromosome.getGenes().subList(0, chromosome.lastImprovedCoverageCodon);
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = chromosome.lastImprovedTrace;
        newChromosome.coverage = new Set<string>(chromosome.coverage);
        newChromosome.lastImprovedCoverageCodon = chromosome.lastImprovedCoverageCodon;
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
            originalChromosome.getGenes().size() > modifiedChromosome.getGenes().size();
    }
}
