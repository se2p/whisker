import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class RegressionNode extends NodeGene {

    /**
     * Constructs a new regression Node
     * @param id the identification number of the node within the network
     * @param activationFunction the activation function of the regression node
     */
    constructor(id: number) {
        super(id, ActivationFunction.NONE, NodeType.OUTPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof RegressionNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new RegressionNode(this.id)

    }

    getActivationValue(): number {
        {
            if (this.activationCount > 0) {
                this.activationValue = this.nodeValue;
                return this.activationValue;
            } else
                return 0.0;
        }
    }


    toString(): string {
        return " RegressionNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
