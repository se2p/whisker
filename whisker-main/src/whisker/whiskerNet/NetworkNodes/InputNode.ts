import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class InputNode extends NodeGene {

    private readonly _sprite: number;

    /**
     * Constructs a new InputNode
     * @param id the identification number of the node within the network
     * @param sprite the number of the sprite this input Node handles
     */
    constructor(id: number, sprite:number) {
        super(id, ActivationFunction.NONE, NodeType.INPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
        this._sprite = sprite;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof InputNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new InputNode(this.id, this._sprite)

    }

    getActivationValue(): number {
        {
            this.activationValue = this.nodeValue;
            return this.activationValue;
        }
    }


    toString(): string {
        return "InputNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }

    get sprite(): number {
        return this._sprite;
    }
}
