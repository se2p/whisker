/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";

export class NodeGene {

    private readonly _id: number
    private readonly _type: NodeType
    private _value: number          // the calculated value of each node

    public static _idCounter = 0;

    constructor(type: NodeType, value: number) {
        this._id = NodeGene._idCounter++;
        this._type = type
        this._value = value;
    }

    get id(): number {
        return this._id;
    }

    get type(): NodeType {
        return this._type;
    }

    get value(): number {
        return this._value;
    }

    set value(value: number) {
        this._value = value;
    }

    public equals(other: unknown): boolean {
        if (!(other instanceof NodeGene)) return false;
        return this.id == other.id;
    }

    toString(): string {
        return " NodeGene{ID: " + this.id + ", Value: " + this.value + ", Type: " + NodeType[this.type] + "}";
    }

}
