/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";

export class NodeGene {

    private _id : number
    private _type: NodeType

    private static _idCounter = 0;

    constructor(type: NodeType) {
        this._id = NodeGene._idCounter++;
        this._type = type
    }

    public equals(other: unknown): boolean {
        if (!(other instanceof NodeGene)) return false;
        return this.id == other.id;
    }

    get id(): number {
        return this._id;
    }
}
