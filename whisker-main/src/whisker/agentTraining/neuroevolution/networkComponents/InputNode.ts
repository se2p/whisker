import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class InputNode extends NodeGene {

    /**
     * The sprite this InputNode is connected to.
     */
    private readonly _sprite: string

    /**
     * The feature of the given sprite this InputNode is connected to.
     */
    private readonly _feature: string;


    /**
     * Constructs a new InputNode.
     * @param uID the unique identifier of this node in the network.
     * @param sprite the name of the sprite this InputNode is connected to.
     * @param feature the feature of the given sprite this InputNode is connected to.
     */
    constructor(uID: number, sprite: string, feature: string) {
        super(uID,0, ActivationFunction.NONE, NodeType.INPUT);
        this._sprite = sprite;
        this._feature = feature;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof InputNode)) return false;
        return this.sprite === other.sprite && this.feature === other.feature;
    }

    clone(): InputNode {
        const clone = new InputNode(this.uID, this.sprite, this.feature);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * Since input nodes no not apply any activation function, the activationValue is set to the pure node value.
     * @returns number activation value of the input node.
     */
    activate(): number {
        this.activationValue = this.nodeValue;
        return this.activationValue;
    }

    /**
     * Input nodes are identified by their type and the represented input feature.
     * @returns identifier based on the node type and represented input feature.
     */
    public identifier(): string {
        return `I:${this.sprite}-${this.feature}`;
    }

    toString(): string {
        return `InputNode{ID: ${this.uID},\
 Value: ${this.activationValue},\
 InputConnections: ${this.incomingConnections},\
 Sprite: ${this.sprite},\
 Feature: ${this.feature}}`;
    }

    /**
     * Transforms the input node into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | string)> {
        const node = {};
        node['id'] = this.uID;
        node['t'] = 'I';
        node['aF'] = ActivationFunction[this.activationFunction];
        node['sprite'] = this.sprite;
        node['feature'] = this.feature;
        node['d'] = this.depth;
        return node;
    }

    get sprite(): string {
        return this._sprite;
    }

    get feature(): string {
        return this._feature;
    }
}
