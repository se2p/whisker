import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";

export class BiasNode extends NodeGene {

    /**
     * Creates a new Bias Node with no activation function
     * @param id the identification number of the node within the network
     */
    constructor(id: number) {
        super(id, ActivationFunction.NONE, NodeType.BIAS);
        this.nodeValue = 1;
        this.lastActivationValue = 1;
        this.activationValue = 1;
        this.activatedFlag = true;
        this.activationCount = 1;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof BiasNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new BiasNode(this.id)

    }

    getActivationValue(): number {
        return 1;
    }

    public reset(): void {
        this.nodeValue = 1;
        this.activationValue = 1;
        this.lastActivationValue = 1;
        this.traversed = false;
    }

    toString(): string {
        return "BiasNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }
}
