import {NetworkChromosome} from "../../networks/NetworkChromosome";
import Statistics from "../../../../utils/Statistics";
import {NoveltyFitness} from "./NoveltyFitness";

export class EventSequenceNovelty extends NoveltyFitness<number[]> {

    private readonly eventMap: Map<string, number> = new Map<string, number>();

    /**
     * The behaviour to be compared corresponds to the event sequence executed by the chromosomes.
     * @param network The network hosting its executed events during the execution in the problem domain.
     * @returns the in the problem domain executed events of the supplied chromosome.
     */
    protected extractBehaviour(network: NetworkChromosome): number[] {
        const events = network.trace.events.map(e => e.event);
        const mapped: number[] = [];
        for (const event of events) {
            if (!this.eventMap.has(event.stringIdentifier())) {
                this.eventMap.set(event.stringIdentifier(), this.eventMap.size);
            }
            mapped.push(this.eventMap.get(event.stringIdentifier()));
        }
        return mapped;
    }


    /**
     * Compares two event sequences using the levenshtein distance.
     * @param eventSequence1 first event sequence to be compared.
     * @param eventSequence2 second event sequence to be compared.
     * @returns distance between the two event sequences based on the levenshtein distance.
     */
    protected compareBehaviours(eventSequence1: number[], eventSequence2: number[]): number {
        // If both sequences are empty, they are identical.
        if (eventSequence1.length === 0 && eventSequence2.length === 0) {
            return 0;
        }

        const distance = Statistics.levenshteinDistance(eventSequence1, eventSequence2);
        return distance / Math.max(eventSequence1.length, eventSequence2.length);
    }
}
