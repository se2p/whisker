import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class InputNode extends NodeGene {

    /**
     * The sprite this InputNode serves
     */
    private readonly _sprite: string

    /**
     * The feature of the given sprite this InputNode handles.
     */
    private readonly _feature: string;


    /**
     * Constructs a new InputNode
     * @param id the identification number of the node within the network
     * @param sprite the name of the sprite this InputNode serves
     * @param feature the feature of the given sprite this InputNode handles
     */
    constructor(id: number, sprite: string, feature: string) {
        super(id, ActivationFunction.NONE, NodeType.INPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
        this._sprite = sprite;
        this._feature = feature;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof InputNode)) return false;
        return this.id === other.id &&
            this.activationFunction === other.activationFunction &&
            this.sprite === other.sprite &&
            this.feature === other.feature;
    }

    clone(): InputNode {
        return new InputNode(this.id, this.sprite, this.feature)

    }

    getActivationValue(): number {
        {
            this.activationValue = this.nodeValue;
            return this.activationValue;
        }
    }

    toString(): string {
        return `InputNode{ID: ${this.id},\
 Value: ${this.activationValue},\
 InputConnections: ${this.incomingConnections},\
 Sprite: ${this.sprite},\
 Feature: ${this.feature}}`;
    }

    get sprite(): string {
        return this._sprite;
    }

    get feature(): string {
        return this._feature;
    }
}
