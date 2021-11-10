import {ScratchEvent} from "./events/ScratchEvent";

export interface EventSelector {

    /**
     * Selects an event from the given list of available events, based on the current codon in the given codon list.
     *
     * @param codons the list of codons
     * @param numCodon the index of the current codon in the codon list
     * @param availableEvents the list of available events
     */
    selectEvent(codons: number[], numCodon: number, availableEvents: ScratchEvent[]): ScratchEvent
}

export class InterleavingEventSelector implements EventSelector {
    selectEvent(codons: number[], numCodon: number, availableEvents: ScratchEvent[]): ScratchEvent {
        return availableEvents[codons[numCodon] % availableEvents.length];
    }
}

/**
 * An event selector that tries to increase the representation locality for grammatical evolution.
 * This is achieved by partitioning the range of codon values into evenly-sized clusters, which
 * are then used to map a codon value to a given set of events. As a result, small changes to a
 * codon value (in the phenotype space) are also more likely to contribute to just a small change
 * in the genotype space (i.e., the selected event will likely stay the same).
 */
export class ClusteringEventSelector implements EventSelector {
    private readonly _valueRange: number;

    constructor({min, max}: { min: number, max: number }) {
        this._valueRange = max - min + 1;
    }

    selectEvent(codons: number[], numCodon: number, availableEvents: ScratchEvent[]): ScratchEvent {
        const codon = codons[numCodon];
        const clusterSize = Math.ceil(this._valueRange / availableEvents.length);

        let current = clusterSize;
        let cluster = 0;
        while (codon >= current) {
            cluster++;
            current += clusterSize;
        }

        return availableEvents[cluster];
    }
}
