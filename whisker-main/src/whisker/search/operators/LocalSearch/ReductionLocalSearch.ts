import {LocalSearch} from "./LocalSearch";
import {TestChromosome} from "../../../testcase/TestChromosome";
import {List} from "../../../utils/List";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {seedScratch} from "../../../../util/random";
import {Randomness} from "../../../utils/Randomness";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";

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
        return chromosome.getGenes().size() > 1 && this._originalChromosomes.indexOf(chromosome) < 0;
    }

    /**
     *
     * @param chromosome the chromosome being modified by ReductionLocalSearch.
     * @returns the modified chromosome wrapped in a Promise.
     */
    async apply(chromosome: TestChromosome): Promise<TestChromosome> {
        this._originalChromosomes.push(chromosome);
        console.log(`Start ReductionLocalSearch`);

        // Save the initial trace and coverage of the chromosome to recover them later.
        const originalTrace = chromosome.trace;
        const originalCoverage = chromosome.coverage;

        // Execute the Chromosome and stop as soon as we have reached the same coverage size as the original Chromosome.
        const events = new List<[ScratchEvent, number[]]>();
        const reducedSize = await this.reduceGenes(chromosome, events);

        // Create the modified Chromosome
        const newCodons = chromosome.getGenes().subList(0, reducedSize);
        const newChromosome = chromosome.cloneWith(newCodons);
        newChromosome.trace = new ExecutionTrace(this._vmWrapper.vm.runtime.traceInfo.tracer.traces, events);
        newChromosome.coverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
        // Reset the trace and coverage of the original chromosome
        chromosome.trace = originalTrace;
        chromosome.coverage = originalCoverage;
        return newChromosome;
    }

    /**
     * Executes the genes of the given chromosome until either all chromosomes have been executed or until
     * we have reached the same amount of blocks as the given chromosome has.
     * @param chromosome the original chromosome which will be reduced in its gene size if possible
     * @param events the events executed by the reduced chromosome.
     * @return returns the stopping point of chromosome execution. This number lets us cut off unnecessary codons.
     */
    private async reduceGenes(chromosome: TestChromosome, events: List<[ScratchEvent, number[]]>): Promise<number> {
        // Set up the VM.
        seedScratch(String(Randomness.getInitialSeed()));
        this._vmWrapper.start();

        let numCodon = 0;
        const originalCoverage = chromosome.coverage;
        const codons = chromosome.getGenes();

        // Execute the genes as long as we didn't reach the block coverage of the original Chromosome.
        while (numCodon < codons.size() - 1) {
            const availableEvents = this._eventExtractor.extractEvents(this._vmWrapper.vm);
            if (availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }
            // Selects and sends the next Event ot the VM.
            numCodon = await this._testExecutor.selectAndSendEvent(codons, numCodon, availableEvents, events);
            const currentCoverage = this._vmWrapper.vm.runtime.traceInfo.tracer.coverage as Set<string>;
            // If we have reached the same amount of blocks as the original Chromosome we can stop.
            if (currentCoverage.size >= originalCoverage.size) {
                break;
            }
        }
        // Stop and reset the VM.
        this._vmWrapper.end();
        this._testExecutor.resetState();
        return numCodon;
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
