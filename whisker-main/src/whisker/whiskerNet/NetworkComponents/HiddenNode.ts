import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";

export class HiddenNode extends NodeGene {

    /**
     * Constructs a new HiddenNode.
     * @param activationFunction the activation function used within this node gene.
     * @param uID the unique identifier of this node in the network.
     */
    constructor(uID: number, activationFunction: ActivationFunction) {
        super(uID, activationFunction, NodeType.HIDDEN);
    }

    equals(other: unknown): boolean {
        if (!(other instanceof HiddenNode)) return false;
        return this.uID === other.uID && this.activationFunction === other.activationFunction;
    }

    clone(): HiddenNode {
        const clone = new HiddenNode(this.uID, this.activationFunction);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.lastActivationValue = this.lastActivationValue;
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
                default:
                    this.activationValue = this.nodeValue;
                    break;
            }
            return this.activationValue;
        } else
            return 0.0;
    }

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
        node[`id`] = this.uID;
        node[`t`] = "H";
        node[`aF`] = ActivationFunction[this.activationFunction];
        return node;
    }

}
