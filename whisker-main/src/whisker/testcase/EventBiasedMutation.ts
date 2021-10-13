
import {TestChromosome} from "./TestChromosome";
import {AbstractVariableLengthMutation} from "../integerlist/AbstractVariableLengthMutation";
import { List } from "../utils/List";
import { EventAndParameters } from "./ExecutionTrace";
import { ScratchEvent } from "./events/ScratchEvent";

/**
 * Sets the probabilities for mutating codons based on the similarity of surrounding events.
 * If there is a sequence of identical events, then they have to share the probability.
 * Given a sequence `A A A B C C`, the "usual" mutation probability would be 1/6 for each codon.
 * With this mutation operator, the probability of mutating any of the `A`s is 1/3 * 1/3, the
 * probability of mutating the `B` is 1/3, and the probability of mutating a `C` is 1/2 * 1/3.
 * This only works if there is an event sequence cached in the test chromosome, so e.g. it cannot
 * be applied after crossover. Only makes sense for some search algorithms, e.g., MIO or a (1+1)EA.
 */
export class EventBiasedMutation extends AbstractVariableLengthMutation<TestChromosome> {

    private _probabilities: number[] = [];

    constructor(min: number, max: number, length: number, gaussianMutationPower: number) {
        super(min, max, length, gaussianMutationPower);
    }

    protected _getMutationProbability(idx: number, numberOfCodons: number): number {
        return this._probabilities[idx];
    }

    private _setDefaultProbabilities(chromosome: TestChromosome): void {
        const numberOfCodons = chromosome.getLength();
        const p = 1 / numberOfCodons;
        this._probabilities = Array(numberOfCodons).fill(p);
    }

    private _setSharedProbabilities(chromosome: TestChromosome, events: List<EventAndParameters>): void {
        this._probabilities = EventBiasedMutation.computeSharedProbabilities(chromosome, events);
    }

    static computeSharedProbabilities(chromosome: TestChromosome, events: List<EventAndParameters>): number[] {
       const indicesByEventType = new Map<string, number[]>();

        let codonIndex = 0;
        for (const ep of events) {
            const { event } = ep;
            if (event == undefined) {
                break;
            }

            const ctorName = event.constructor.name;
            if (!indicesByEventType.has(ctorName)) {
                indicesByEventType.set(ctorName, []);
            }

            const indices = indicesByEventType.get(ctorName);
            const count = ep.getCodonCount();
            for (const upper = codonIndex + count; codonIndex < upper; codonIndex++) {
                indices.push(codonIndex);
            }
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

        while (probabilities.length < chromosome.getLength()) {
            probabilities.push(0);
        }

        return probabilities;
    }

    private _initializeMutationProbabilities(chromosome: TestChromosome): void {
        const { events } = chromosome.trace;

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
