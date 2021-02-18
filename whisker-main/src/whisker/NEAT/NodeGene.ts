/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";
import {ConnectionGene} from "./ConnectionGene";
import {List} from "../utils/List";

export class NodeGene {

    private readonly _id: number;
    private readonly _type: NodeType
    private _nodeValue: number          // the value of the node (sum of all incoming nodes * weights)
    private _activationValue: number          // the activation value of the node
    private _activationCount: number // counts how often this node has been activated -> used for activating entire network
    private _activatedFlag: boolean  // checks if the node has been activated in the current network activation run
    private _incomingConnections = new List<ConnectionGene>() // list of incoming connections -> used for calculating the activation value

    public static _idCounter = 0;

    constructor(id: number, type: NodeType) {
        this._id = id;
        this._type = type
        if(type === NodeType.BIAS){
            this._nodeValue = 1;
            this._activationValue = 1;
        }
        else {
            this._activationValue = 0;
            this._nodeValue = 0;
        }

        if(type === NodeType.OUTPUT) {
            this._activatedFlag = false;
            this._activationCount = 0;
        }
        else {
            this.activatedFlag = true;
            this._activationCount = 1;
        }
    }

    public clone(): NodeGene {
        return new NodeGene(this._id, this._type)
    }

    public getActivationValue() {
        if (this.activationCount > 0)
            return this.activationValue;
        else
            return 0.0;
    }

    get id(): number {
        return this._id;
    }

    get type(): NodeType {
        return this._type;
    }

    get nodeValue(): number {
        return this._nodeValue;
    }

    set nodeValue(value: number) {
        this._nodeValue = value;
    }

    get activationValue(): number {
        return this._activationValue;
    }

    set activationValue(value: number) {
        this._activationValue = value;
    }

    get activationCount(): number {
        return this._activationCount;
    }

    set activationCount(value: number) {
        this._activationCount = value;
    }

    get activatedFlag(): boolean {
        return this._activatedFlag;
    }

    set activatedFlag(value: boolean) {
        this._activatedFlag = value;
    }

    get incomingConnections(): List<ConnectionGene> {
        return this._incomingConnections;
    }

    set incomingConnections(value: List<ConnectionGene>) {
        this._incomingConnections = value;
    }

    public equals(other: unknown): boolean {
        if (!(other instanceof NodeGene)) return false;
        return this.id === other.id
    }

    toString(): string {
        return " NodeGene{ID: " + this._id + ", Value: " + this.activationValue + ", Type: " + NodeType[this.type] +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
