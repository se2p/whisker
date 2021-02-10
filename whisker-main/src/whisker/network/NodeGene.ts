/**
 * The NodeGene represents a single Node of the neural network
 */
import {NodeType} from "./NodeType";

export class NodeGene {
    private _id : number
    private _type: NodeType

    constructor(id:number, type:NodeType) {
        this._id = id;
        this._type = type
    }
}
