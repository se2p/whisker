/**
 * A ConnectionGene represents the connections of a neural network
 */
import {NodeGene} from "./NodeGene";

export class ConnectionGene {
    private _from: NodeGene;
    private _to: NodeGene;
    private _weight: number;
    private _enabled: boolean;
    private _innovationNumber: number

    private static _innovationNumber = 0;

    constructor(from: NodeGene, to: NodeGene, weight: number, enabled: boolean) {
        this._from = from;
        this._to = to;
        this._weight = weight;
        this._enabled = enabled;
        this._innovationNumber = ConnectionGene._innovationNumber++;
    }

    get from(): NodeGene {
        return this._from;
    }

    set from(value: NodeGene) {
        this._from = value;
    }

    get to(): NodeGene {
        return this._to;
    }

    set to(value: NodeGene) {
        this._to = value;
    }

    get weight(): number {
        return this._weight;
    }

    set weight(value: number) {
        this._weight = value;
    }

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get innovationNumber(): number {
        return this._innovationNumber;
    }

    /**
     * Innovation number is already included by evaluating the equals of the NodeGenes
     * @param other the other Gene to compare this ConnectionGene to
     */
    public equals(other: unknown): boolean {
        if (!(other instanceof ConnectionGene)) return false;
        return this.from.equals(other.from) && this.to.equals(other.to);
    }
}
