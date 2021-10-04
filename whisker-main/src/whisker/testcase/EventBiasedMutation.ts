
import {TestChromosome} from "./TestChromosome";
import {List} from "../utils/List";
import {AbstractVariableLengthMutation} from "../integerlist/AbstractVariableLengthMutation";

/**
 * Mutates every codon with the same probability.
 */
export class EventBiasedMutation extends AbstractVariableLengthMutation<TestChromosome> {

    private _probabilities = new List<number>();

    constructor(min: number, max: number, length: number, gaussianMutationPower: number) {
        super(min, max, length, gaussianMutationPower);
    }

    protected _getMutationProbability(idx: number, numberOfCodons: number): number {
        return this._probabilities.get(idx);
    }

    private setDefaultProbabilities(chromosome: TestChromosome): void {
        this._probabilities.clear();
        const numberOfCodons = chromosome.getLength();
        for (let i = 0; i < chromosome.getLength(); i++) {
            this._probabilities.add(1 / numberOfCodons);
        }
    }

    private initializeMutationProbabilities(chromosome: TestChromosome): void {
        if (chromosome.trace === undefined) {
            this.setDefaultProbabilities(chromosome);
        } else {
            let numCodon = 0;
            let numEvent = 0;
            const numberOfCodons = chromosome.getLength();
            const events = chromosome.trace.events;

            let numGroups = 0;
            const numberInGroup = new List<number>();

            while (numCodon < numberOfCodons) {
                const currentEvent = events.get(2 * numEvent);
                if (currentEvent === undefined) {
                    // this._probabilities.add(1 / numberOfCodons);
                    const numRemainingCodons = numberOfCodons - numCodon;
                    for (let i = numCodon; i < numberOfCodons; i++) {
                        numberInGroup.add(0);
                    }
                    break;
                }
                numGroups += 1;
                let numSimilarEvents = 1;
                let numSimilarCodons = 1 + currentEvent[1].length;
                let nextEvent = events.get(2 * numEvent + 2);
                while (nextEvent !== undefined && currentEvent[0].constructor.name === nextEvent[0].constructor.name) {
                    numSimilarEvents += 1;
                    numSimilarCodons += 1 + nextEvent[1].length;
                    nextEvent = events.get(numEvent + 2 * numSimilarEvents);
                }

                for (let i = numCodon; i < numCodon + numSimilarCodons; i++) {
                    numberInGroup.add(numSimilarCodons);
                }

                numCodon += numSimilarCodons;
                numEvent += numSimilarEvents;
            }

            this._probabilities.clear();
            for (let i = 0; i < numberOfCodons; i++) {
                const numSimilar = numberInGroup.get(i);
                if (numSimilar == 0) {
                    this._probabilities.add(0);
                } else {
                    this._probabilities.add((1 / numSimilar) * (1 / numGroups));
                }
            }
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
        this.initializeMutationProbabilities(chromosome);
        return super.applyUpTo(chromosome, chromosome.getLength());
    }
}
