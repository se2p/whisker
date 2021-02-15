/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";
import {List} from "../utils/List";

export class NodeGene {

    private readonly _id: number;
    private readonly _type: NodeType
    private _value: number          // the calculated value of each node
    private _inputConnections = new List<ConnectionGene>() // list of input connections -> used for calculating the value

    public static _idCounter = 0;

    constructor(id: number, type: NodeType, value: number) {
        this._id = id;
        this._type = type
        this._value = value;
    }

    public clone(): NodeGene {
        return new NodeGene(this._id, this.type, this.value)
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

    get inputConnections(): List<ConnectionGene> {
        return this._inputConnections;
    }

    set inputConnections(connectionGenes: List<ConnectionGene>) {
        this._inputConnections = connectionGenes;
    }

    public equals(other: unknown): boolean {
        if (!(other instanceof NodeGene)) return false;
        return this.id === other.id
    }

    toString(): string {
        return " NodeGene{ID: " + this._id + ", Value: " + this.value + ", Type: " + NodeType[this.type] +
            ", InputConnections: " + this.inputConnections + "}";
    }

}
