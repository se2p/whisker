import {NodeGene} from "./NodeGene";

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
     * The gradient defined by the backward pass and used to update the connection weight during gradient descent.
     */
    private _gradient = 0;

    /**
     * Defines whether the connection is enabled.
     */
    private _isEnabled: boolean;

    /**
     * The innovation number of the connection.
     */
    private _innovation: number;

    /**
     * Defines whether the connection is a recurrent connection.
     */
    private readonly _isRecurrent: boolean;

    /**
     * Counter used for obtaining the next available innovation number.
     */
    private static innovationCounter = 0;

    /**
     * Constructs a new connection gene.
     * @param source the source node of the connection.
     * @param target the target node of the connection.
     * @param weight the weight of the connection.
     * @param enabled defines whether the connection is enabled.
     * @param innovation the innovation number of the connection.
     */
    constructor(source: NodeGene, target: NodeGene, weight: number, enabled: boolean, innovation: number) {
        this._source = source;
        this._target = target;
        this._weight = weight;
        this._isEnabled = enabled;
        this._innovation = innovation;
        this._isRecurrent = source.depth >= target.depth;
    }

    /**
     * Clones this connection including its attributes but using the passed nodes as source and target nodes.
     * @param source the source node of the new connection.
     * @param target the target node of the new connection.
     */
    public cloneWithNodes(source: NodeGene, target: NodeGene): ConnectionGene {
        return new ConnectionGene(source, target, this.weight, this.isEnabled, this.innovation);
    }

    /**
     * Check for equality by comparing the source and target nodes.
     * @param other the other connection to compare this connection with.
     */
    public equalsByNodes(other: unknown): boolean {
        if (!(other instanceof ConnectionGene)) return false;
        return this.source.equals(other.source) &&
            this.target.equals(other.target) &&
            this.isRecurrent === other.isRecurrent;
    }

    /**
     * Returns the next available innovation number and increases the counter.
     * @returns number next innovation number.
     */
    static getNextInnovationNumber(): number {
        return ++ConnectionGene.innovationCounter;
    }

    toString(): string {
        return `ConnectionGene{FromId: ${this.source.uID}\
, ToId: ${this.target.uID}\
, Weight: ${this.weight}\
, Enabled: ${this.isEnabled}\
, Recurrent: ${this.isRecurrent}\
, InnovationNumber: ${this.innovation}}`;
    }

    /**
     * Transforms this ConnectionGene into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | boolean)> {
        const connection = {};
        connection['s'] = this.source.uID;
        connection['t'] = this.target.uID;
        connection['w'] = Number(this.weight.toFixed(5));
        connection['e'] = this.isEnabled;
        connection['i'] = this.innovation;
        connection['r'] = this.isRecurrent;
        return connection;
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

    get gradient(): number {
        return this._gradient;
    }

    set gradient(value: number) {
        this._gradient = value;
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

    get isRecurrent(): boolean {
        return this._isRecurrent;
    }
}
