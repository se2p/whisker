import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";

export class ClassificationNode extends NodeGene {

    /**
     * Constructs a new classification Node
     * @param id the identification number of the node within the network
     * @param activationFunction the activation function of the classification node
     */
    constructor(id: number, activationFunction: ActivationFunction) {
        super(id, activationFunction, NodeType.OUTPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof ClassificationNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new ClassificationNode(this.id, this.activationFunction)

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
        return " ClassificationNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
