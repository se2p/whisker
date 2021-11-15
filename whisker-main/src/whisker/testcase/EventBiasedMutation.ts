import {TestChromosome} from "./TestChromosome";
import {AbstractVariableLengthMutation} from "../integerlist/AbstractVariableLengthMutation";
import {EventAndParameters} from "./ExecutionTrace";
import Arrays from "../utils/Arrays";
import {WaitEvent} from "./events/WaitEvent";

/**
 * Sets the probabilities for mutating codons based on the similarity of surrounding events.
 * If there is a sequence of identical events, then they have to share the probability of
 * `(1 / number of codons in the sequence) / number of sequences`. For example,
 * given a sequence `A A A B C C`, the "usual" mutation probability would be 1/6 for each codon.
 * With this mutation operator, we consider three distinct groups consisting only of As, Bs and Cs.
 * Every such group as a whole has the same mutation probability (here: 1/3). Within each group,
 * the mutation probability is the same for every codon. In the case of `A A A`, we have 3 identical
 * events A and thus a probability of (1/3)/3 for every individual codon. Analogously, the probability
 * for a codon in `B` is (1/1)/3, and the probability of mutation a codon in `C C` is (1/2)/3.
 * These computations only works if there is an event sequence cached in the test chromosome, so e.g.
 * it cannot be applied after crossover. Only makes sense for some search algorithms, e.g., MIO, (1+1)EA,
 * or when crossover is disabled.
 */
export class EventBiasedMutation extends AbstractVariableLengthMutation<TestChromosome> {

    private _probabilities: number[] = [];

    constructor(min: number, max: number, length: number, reservedCodons:number , gaussianMutationPower: number) {
        super(min, max, length, reservedCodons, gaussianMutationPower);
    }

    protected _getMutationProbability(idx: number): number {
        return this._probabilities[idx];
    }

    private _setDefaultProbabilities(chromosome: TestChromosome): void {
        const eventGroups = Arrays.chunk(chromosome.getGenes(), this._reservedCodons);
        const numberOfEventGroups = eventGroups.length;
        const p = 1 / numberOfEventGroups;
        this._probabilities = Array(numberOfEventGroups).fill(p);
    }

    private _setSharedProbabilities(chromosome: TestChromosome, events: EventAndParameters[]): void {
        const eventGroups = Arrays.chunk(chromosome.getGenes(), this._reservedCodons);
        this._probabilities = EventBiasedMutation.computeSharedProbabilities(eventGroups.length, events);
    }

    static computeSharedProbabilities(eventGroupsLength: number, events: EventAndParameters[]): number[] {
        const indicesByEventType = new Map<string, number[]>();

        let codonIndex = 0;
        for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
            const ep = events[eventIndex];
            const {event} = ep;
            if (event == undefined) {
                break;
            }

            // Skip WaitEvents that are inserted between selected Events during TestExecution.
            if(eventIndex % 2 !== 0 && event instanceof WaitEvent && event.getParameters()[0] === 1){
                continue;
            }

            const ctorName = event.constructor.name;
            if (!indicesByEventType.has(ctorName)) {
                indicesByEventType.set(ctorName, []);
            }

            const indices = indicesByEventType.get(ctorName);
            indices.push(codonIndex);
            codonIndex++;
        }

        const numberDifferentEventTypes = indicesByEventType.size;
        const probabilities = [];

        for (const indices of indicesByEventType.values()) {
            const eventsOfSameType = indices.length;
            const probability = (1 / eventsOfSameType) / numberDifferentEventTypes;
            for (const i of indices) {
                probabilities[i] = probability;
            }
        }

        while (probabilities.length < eventGroupsLength) {
            probabilities.push(0);
        }

        return probabilities;
    }

    private _initializeMutationProbabilities(chromosome: TestChromosome): void {
        const {events} = chromosome.trace;

        if (events) {
            this._setSharedProbabilities(chromosome, events);
        } else {
            this._setDefaultProbabilities(chromosome);
        }
    }

    /**
     * Returns a mutated deep copy of the given chromosome.
     * Each integer in the codon list mutates with a probability of one divided by the lists size.
     * If a index inside the list mutates it executes one of the following mutations with equal probability:
     *  - add a new codon to the list at the index
     *  - replace the current codon at the index using gaussian noise
     *  - remove the current codon at the index
     * @param chromosome The original chromosome, that mutates.
     * @return A mutated deep copy of the given chromosome.
     */
    apply(chromosome: TestChromosome): TestChromosome {
        this._initializeMutationProbabilities(chromosome);
        return super.applyUpTo(chromosome, chromosome.getLength());
    }
}
