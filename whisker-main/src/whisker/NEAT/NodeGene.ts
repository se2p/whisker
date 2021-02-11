/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";
import {Gene} from "./Gene";

export class NodeGene extends Gene {
    private _id: number
    private _type: NodeType

    constructor(innovationNumber: number, id: number, type: NodeType) {
        super(innovationNumber)
        this._id = id;
        this._type = type
    }

    public equals(other: unknown): boolean {
        if (!(other instanceof NodeGene)) return false;
        return this.getInnovationNumber() == other.getInnovationNumber();
    }
}
