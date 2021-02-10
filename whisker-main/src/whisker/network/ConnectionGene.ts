/**
 * A connection Gene representing the connections of a neural network
 */

export class ConnectionGene {
    private _in: Node;
    private _out: Node;
    private _weight: number;
    private _enabled: boolean;
    private _innovation: number;

    constructor(inNode: Node, outNode: Node, weight: number, enabled: boolean, innovation: number) {
        this._in = inNode;
        this._out = outNode;
        this._weight = weight;
        this._enabled = enabled;
        this._innovation = innovation;
    }
}
