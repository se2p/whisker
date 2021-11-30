import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class BiasNode extends NodeGene {

    /**
     * Creates a new bias node which has no activation function an a constant activation value of 1.
     * @param incrementIDCounter flag determining whether the uID counter should be increased after constructing a
     * new bias node.
     */
    constructor(incrementIDCounter = true) {
        super(ActivationFunction.NONE, NodeType.BIAS, incrementIDCounter);
        this.nodeValue = 1;
        this.lastActivationValue = 1;
        this.activationValue = 1;
        this.activatedFlag = true;
        this.activationCount = 1;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof BiasNode)) return false;
        return this.uID === other.uID;
    }

    clone(): BiasNode {
        const clone = new BiasNode(false);
        clone.uID = this.uID;
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.lastActivationValue = this.lastActivationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone
    }

    /**
     * The bias node is defined to always send a bias value of 1 into the network.
     * @returns the bias node's activation function which is defined to have a constant value of one.
     */
    getActivationValue(): number {
        return 1;
    }

    public reset(): void {
        this.nodeValue = 1;
        this.activationValue = 1;
        this.lastActivationValue = 1;
        this.traversed = false;
        this.activatedFlag = true;
    }

    toString(): string {
        return `BiasNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, InputConnections: ${this.incomingConnections}}`;
    }

    public toJSON(): Record<string, (number | string)> {
        const node = {}
        node[`id`] = this.uID;
        node[`t`] = "B";
        node[`aF`] = ActivationFunction[this.activationFunction];
        return node;
    }
}
