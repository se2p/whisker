import {NodeGene} from "./NetworkNodes/NodeGene";

export class ConnectionGene {
    /**
     * The source node of the connection.
     */
    private readonly _source: NodeGene;

    /**
     * The target node of the connection.
     */
    private readonly _target: NodeGene;

    /**
     * The weight of the connection.
     */
    private _weight: number;

    /**
     * Defines whether the connection is enabled.
     */
    private _isEnabled: boolean;

    /**
     * The innovation number of this connection.
     */
    private _innovation: number;

    /**
     * Defines whether this connection is a recurrent connection.
     */
    private readonly _recurrent: boolean;

    /**
     * Saves the next available innovation number.
     */
    private static innovationCounter = 0;

    /**
     * Constructs a new connection gene
     * @param from the source node of the connection
     * @param to the target node of the connection
     * @param weight the weight of the connection
     * @param enabled defines whether the connection is enabled
     * @param innovation the innovation nubmer of the connection
     * @param recurrent defines whether the connection is a recurrent connection
     */
    constructor(from: NodeGene, to: NodeGene, weight: number, enabled: boolean, innovation: number, recurrent: boolean) {
        this._source = from;
        this._target = to;
        this._weight = weight;
        this._isEnabled = enabled;
        this._innovation = innovation;
        this._recurrent = recurrent;
    }

    /**
     * Clones this connection using the given nodes as source and target nodes.
     * @param source the source node of the new connection
     * @param target the target node of the new connection
     */
    public cloneWithNodes(source: NodeGene, target: NodeGene): ConnectionGene {
        return new ConnectionGene(source, target, this.weight, this.isEnabled, this.innovation, this.recurrent)
    }

    /**
     * Check equality by comparing the source and target nodes
     * @param other the other connection to compare this connection with
     */
    public equalsByNodes(other: unknown): boolean {
        if (!(other instanceof ConnectionGene)) return false;
        return this.source.equals(other.source) && this.target.equals(other.target) && (this.recurrent === other.recurrent);
    }

    toString(): string {
        return "ConnectionGene{FromId: " + this.source.id + ", ToId: " + this.target.id + ", Weight: " + this.weight +
            ", Enabled: " + this.isEnabled + ", InnovationNumber: " + this.innovation + "}"
    }

    get source(): NodeGene {
        return this._source;
    }

    get target(): NodeGene {
        return this._target;
    }

    get weight(): number {
        return this._weight;
    }

    set weight(value: number) {
        this._weight = value;
    }

    get isEnabled(): boolean {
        return this._isEnabled;
    }

    set isEnabled(value: boolean) {
        this._isEnabled = value;
    }

    get innovation(): number {
        return this._innovation;
    }

    set innovation(innovation: number) {
        this._innovation = innovation;
    }

    static getNextInnovationNumber(): number {
        return ++ConnectionGene.innovationCounter;
    }

    get recurrent(): boolean {
        return this._recurrent;
    }
}
