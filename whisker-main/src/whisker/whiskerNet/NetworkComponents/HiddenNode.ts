import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../Misc/NeuroevolutionUtil";

export class HiddenNode extends NodeGene {

    /**
     * Constructs a new HiddenNode.
     * @param activationFunction the activation function used within this node gene.
     * @param depth the depth of the node within the network.
     * @param uID the unique identifier of this node in the network.
     */
    constructor(uID: number, depth:number, activationFunction: ActivationFunction) {
        super(uID, depth, activationFunction, NodeType.HIDDEN);
    }

    /**
     * Two hidden nodes are equal if they have the same identifier. However, each hidden node inside a network
     * should have its own identifier!
     * @param other the node to compare this node to.
     */
    equals(other: unknown): boolean {
        if (!(other instanceof HiddenNode)) return false;
        return this.uID === other.uID;
    }

    clone(): HiddenNode {
        const clone = new HiddenNode(this.uID, this.depth, this.activationFunction);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * Calculates the activation value of the hidden node based on the node value and the activation function.
     * @returns number activation value of the hidden node.
     */
    activate(): number {
        if (this.activatedFlag) {
            switch (this.activationFunction) {
                case ActivationFunction.SIGMOID:
                    this.activationValue = NeuroevolutionUtil.sigmoid(this.nodeValue, 1);
                    break;
                case ActivationFunction.TANH:
                    this.activationValue = Math.tanh(this.nodeValue);
                    break;
                case ActivationFunction.RELU:
                    this.activationValue = Math.max(0, this.nodeValue);
                    break;
                default:
                    this.activationValue = this.nodeValue;
                    break;
            }
            return this.activationValue;
        } else
            return 0.0;
    }

    /**
     * Hidden nodes are identified by their type and the uID due to the absence of other crucial attributes.
     * @returns identifier based on the node type and the uID.
     */
    public identifier(): string {
        return `H:${this.uID}`;
    }

    toString(): string {
        return `HiddenNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, InputConnections: ${this.incomingConnections}}`;
    }

    public toJSON(): Record<string, (number | string)> {
        const node = {};
        node['id'] = this.uID;
        node['t'] = "H";
        node['aF'] = ActivationFunction[this.activationFunction];
        node['d'] = this.depth;
        return node;
    }

}
