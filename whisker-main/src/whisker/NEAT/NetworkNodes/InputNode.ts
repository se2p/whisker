import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {HiddenNode} from "./HiddenNode";

export class InputNode extends NodeGene {

    /**
     * Constructs a new InputNode
     * @param id the identification number of the node within the network
     */
    constructor(id: number) {
        super(id, ActivationFunction.NONE, NodeType.INPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof InputNode)) return false;
        return this.id === other.id && this.activationFunction === other.activationFunction;
    }

    clone(): NodeGene {
        return new InputNode(this.id)

    }

    getActivationValue(): number {
        {
            this.activationValue = this.nodeValue;
            return this.activationValue;
        }
    }


    toString(): string {
        return "InputNode{ID: " + this.id + ", Value: " + this.activationValue +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
