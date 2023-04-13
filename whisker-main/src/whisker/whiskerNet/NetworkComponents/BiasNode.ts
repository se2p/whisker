import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class BiasNode extends NodeGene {

    /**
     * Creates a new bias node which has no activation function a constant activation value of 1.
     * @param uID the unique identifier of this node in the network.
     */
    constructor(uID: number) {
        super(uID, 0, ActivationFunction.NONE, NodeType.BIAS);
        this.nodeValue = 1;
        this.activationValue = 1;
        this.activatedFlag = true;
        this.activationCount = 1;
    }

    /**
     * Bias nodes are compared based on their identifier. However, no network should contain more than one bias node.
     * @param other the node to compare this node to.
     */
    equals(other: unknown): boolean {
        if (!(other instanceof BiasNode)) return false;
        return this.uID === other.uID;
    }

    clone(): BiasNode {
        const clone = new BiasNode(this.uID);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * The bias node is defined to always send a bias value of 1 into the network.
     * @returns the bias node's activation function which is defined to have a constant value of one.
     */
    activate(): number {
        return 1;
    }

    /**
     * The BiasNode node emits a constant value of 1.
     */
    public override reset(): void {
        this.nodeValue = 1;
        this.activationValue = 1;
        this.traversed = false;
        this.activatedFlag = true;
    }

    /**
     * Since we should only have one single bias node in each network, the node type is sufficient as identifier.
     * @returns identifier based on the node type.
     */
    public identifier(): string {
        return `B`;
    }

    toString(): string {
        return `BiasNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, InputConnections: ${this.incomingConnections}}`;
    }

    public toJSON(): Record<string, (number | string)> {
        const node = {};
        node['id'] = this.uID;
        node['t'] = "B";
        node['aF'] = ActivationFunction[this.activationFunction];
        node['d'] = this.depth;
        return node;
    }
}
