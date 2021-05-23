import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";

export class RegressionNode extends NodeGene {

    /**
     * The event parameter this regression node serves.
     */
    private readonly _eventParameter: string

    /**
     * Constructs a new regression Node
     * @param id the identification number of the node within the network
     * @param eventParameter the event parameter to which this regression node creates values for
     * @param activationFunction the activation function of the regression node
     */
    constructor(id: number, eventParameter: string, activationFunction: ActivationFunction) {
        super(id, activationFunction, NodeType.OUTPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
        this._eventParameter = eventParameter;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof RegressionNode)) return false;
        return this.id === other.id
            && this.eventParameter === other.eventParameter
            && this.activationFunction === other.activationFunction;
    }

    clone(): RegressionNode {
        return new RegressionNode(this.id, this.eventParameter, this.activationFunction)
    }

    getActivationValue(): number {
        if (this.activationCount > 0) {
            switch (this.activationFunction) {
                case ActivationFunction.RELU:
                    this.activationValue = NeuroevolutionUtil.relu(this.nodeValue);
                    break;
                case ActivationFunction.NONE:
                    this.activationValue = this.nodeValue;
                    break;
            }
            return this.activationValue;
        } else
            return 0.0;
    }

    get eventParameter(): string {
        return this._eventParameter;
    }

    /**
     * Returns the Name of the event, omitting the parameter names.
     */
    public getEventName(): string {
        return this.eventParameter.split("-")[0];
    }

    toString(): string {
        return " RegressionNode{ID: " + this.id +
            ", Value: " + this.activationValue +
            ", ActivationFunction: " + this.activationFunction +
            ", InputConnections: " + this.incomingConnections + "}";
    }

}
