import {List} from "../utils/List";
import {ScratchEvent} from "./events/ScratchEvent";

export interface EventSelector {
    selectEvent(codons: List<number>, numCodon: number, availableEvents: List<ScratchEvent>): ScratchEvent
}

export class UniformEventSelector implements EventSelector {

    /**
     * Selects an event from the given list of available events, based on the current codon in the given codon list.
     *
     * @param codons the list of codons
     * @param numCodon the index of the current codon in the codon list
     * @param availableEvents the list of available events
     */
    selectEvent(codons: List<number>, numCodon: number, availableEvents: List<ScratchEvent>): ScratchEvent {
        return availableEvents.get(codons.get(numCodon) % availableEvents.size());
    }
}

export class LocalityEventSelector implements EventSelector {
    private readonly _valueRange: number;

    constructor({min, max}: { min: number, max: number }) {
        this._valueRange = max - min + 1;
    }

    selectEvent(codons: List<number>, numCodon: number, availableEvents: List<ScratchEvent>): ScratchEvent {
        const codon = codons.get(numCodon);
        const bucketSize = Math.floor(this._valueRange / availableEvents.size());

        let current = bucketSize;
        let rule = 0;
        while (codon >= current) {
            rule++;
            current += bucketSize;
        }

        return availableEvents.get(rule);
    }
}
