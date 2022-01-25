import {ConnectionGene} from "./ConnectionGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export abstract class NodeGene {

    /**
     * Counter used for assigning the unique identifier.
     */
    public static _uIDCounter = 0;

    /**
     * The unique identifier of a node.
     */
    private _uID: number

    /**
     * The value of a node, which is defined to be the sum of all incoming connections.
     */
    private _nodeValue = 0;

    /**
     * The activation function of this node.
     */
    private readonly _activationFunction: number

    /**
     * The activation value of a node, which is defined to be the activation function applied to the node value.
     */
    private _activationValue: number

    /**
     * Counts how often this node has been activated.
     */
    private _activationCount = 0;

    /**
     * True if the node has been activated at least once within one network activation.
     */
    private _activatedFlag = false;

    /**
     * Holds all incoming connections.
     */
    private _incomingConnections: ConnectionGene[] = [];

    /**
     * Activation value of a previous time step.
     */
    private _lastActivationValue = 0;

    /**
     * True if this node has been traversed.
     */
    private _traversed = false;

    /**
     * The type of the node (Input | Bias | Hidden | Output).
     */
    private readonly _type: NodeType

    /**
     * Creates a new node.
     * @param activationFunction the activation function of the node
     * @param type the type of the node (Input | Hidden | Output)
     * @param incrementIDCounter flag determining whether the uID counter should be increased after constructing a
     * new node gene.
     */
    protected constructor(activationFunction: ActivationFunction, type: NodeType, incrementIDCounter = true) {
        this._uID = NodeGene._uIDCounter;
        this._activationFunction = activationFunction;
        this._type = type;
        if(incrementIDCounter){
            NodeGene._uIDCounter++;
        }
    }

    /**
     * Calculates the activation value of the node based on the node value and the activation function.
     * @returns number activation value of the given node.
     */
    public abstract getActivationValue(): number

    /**
     * Resets the node.
     */
    public reset(): void {
        this.activationCount = 0;
        this.activationValue = 0;
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activatedFlag = false;
        this.traversed = false;
    }

    public abstract equals(other: unknown): boolean

    public abstract clone(): NodeGene

    public abstract identifier(): string;

    public abstract toString(): string

    public abstract toJSON(): Record<string, (number | string)>;

    get uID(): number {
        return this._uID;
    }

    set uID(value: number) {
        this._uID = value;
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

    get incomingConnections(): ConnectionGene[] {
        return this._incomingConnections;
    }

    set incomingConnections(value: ConnectionGene[]) {
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
