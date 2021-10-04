
import {TestChromosome} from "./TestChromosome";
import {AbstractVariableLengthMutation} from "../integerlist/AbstractVariableLengthMutation";
import { ScratchEvent } from "./events/ScratchEvent";
import { List } from "../utils/List";

/**
 * Sets the probabilities for mutating codons based on the similarity of surrounding events.
 * If there is a sequence of identical events, then they have to share the probability.
 * Given a sequence `A A A B B C`, the "usual" mutation probability would be 1/6 for each codon.
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

    private _setSharedProbabilities(chromosome: TestChromosome, codons: List<[ScratchEvent, number[]]>): void {
        const groupSizes = [];

        // The codons represent events. An event is characterized by one event type codon, followed
        // arbitrarily many parameter codons.
        const [firstEvent, firstParams] = codons.get(0);
        let currentGroupSize = firstParams.length + 1;

        for (let i = 1; i < codons.size(); ++i) {
            const [prevEvent] = codons.get(i - 1);
            const [eventType, eventParams] = codons.get(i);

            if (eventType === undefined) {
                groupSizes.push(currentGroupSize);
                break;
            }

            const sameEventType = prevEvent.constructor.name == eventType.constructor.name;
            if (sameEventType) {
                currentGroupSize += eventParams.length + 1;
                groupSizes.push(currentGroupSize);
            } else {
                currentGroupSize = 0;
            }
        }

        const probabilities = [];
        const pCollapsed = 1 / groupSizes.length;
        for (const s of groupSizes) {
            const p = (1 / s) * pCollapsed;
            for (let i = 0; i < s; ++i) {
                probabilities.push(p);
            }
        }

        const numberOfCodons = chromosome.getLength();
        while (probabilities.length < numberOfCodons) {
            probabilities.push(0);
        }

        this._probabilities = probabilities;
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
