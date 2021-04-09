import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";

export class HiddenNode extends NodeGene {

    /**
     * Constructs a new HiddenNode
     * @param id the identification number of the node within the network
     * @param activationFunction the activation function of the hidden node
     */
    constructor(id: number, activationFunction: ActivationFunction) {
        super(id, activationFunction, NodeType.HIDDEN);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof HiddenNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new HiddenNode(this.id, this.activationFunction)
    }

    getActivationValue(): number {
        {
            if (this.activationCount > 0) {
                switch (this.activationFunction) {
                    case ActivationFunction.SIGMOID:
                        this.activationValue = NeuroevolutionUtil.sigmoid(this.nodeValue);
                        break;
                    default:
                        this.activationValue = this.nodeValue;
                        break;
                }
                return this.activationValue;
            } else
                return 0.0;
        }
    }

    toString(): string {
        return " HiddenNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
