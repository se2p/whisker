import {ConnectionGene} from "../ConnectionGene";
import {List} from "../../utils/List";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export abstract class NodeGene {

    /**
     * The id of a Node within a network
     */
    private readonly _id: number

    /**
     * The value of a Node: sum of all incoming nodes * weights
     */
    private _nodeValue: number

    /**
     * The activation function of this node
     */
    private readonly _activationFunction: number

    /**
     * The activation Value of a node: activationFunction(nodeValue)
     */
    private _activationValue: number

    /**
     * Counts how often this node has been activated (used for network activation)
     */
    private _activationCount: number

    /**
     * True if the node has been activated at least once within one network activation
     */
    private _activatedFlag: boolean

    /**
     * List of all incoming connections of this node.
     */
    private _incomingConnections: List<ConnectionGene>

    /**
     * Activation value of a previous time step
     */
    private _lastActivationValue: number

    /**
     * True if this node has been traversed. Used for checking if a network is a recurrent network
     */
    private _traversed: boolean

    /**
     * The type of the node (Input | Hidden | Output)
     */
    private readonly _type: NodeType

    /**
     * Creates a new Node
     * @param id the identification number of the node within the network
     * @param activationFunction the activation function of the node
     * @param type the type of the node (Input | Hidden | Output)
     */
    protected constructor(id: number, activationFunction: ActivationFunction, type: NodeType) {
        this._id = id
        this._activationFunction = activationFunction;
        this._type = type;
        this._activatedFlag = false;
        this._activationCount = 0;
        this._traversed = false;
        this._activationFunction = activationFunction;
        this._incomingConnections = new List<ConnectionGene>();
    }


    /**
     * Calculates the activation value corresponding to the defined activation function
     */
    public abstract getActivationValue(): number

    /**
     * Resets the node
     */
    public reset(): void {
        this.activationCount = 0;
        this.activationValue = 0;
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activatedFlag = false;
        this.traversed = false;
    }

    /**
     * Equal check: Two nodes are equal if they have the same id
     * @param other the node this is compared to
     */
    public abstract equals(other: unknown): boolean

    public abstract clone(): NodeGene

    abstract toString(): string

    /**
     * Transforms this NodeGene into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    abstract toJSON();

    get id(): number {
        return this._id;
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

    get activationFunction(): number {
        return this._activationFunction;
    }

    get lastActivationValue(): number {
        return this._lastActivationValue;
    }

    set lastActivationValue(value: number) {
        this._lastActivationValue = value;
    }

    get traversed(): boolean {
        return this._traversed;
    }

    set traversed(value: boolean) {
        this._traversed = value;
    }

    get type(): NodeType {
        return this._type;
    }
}
