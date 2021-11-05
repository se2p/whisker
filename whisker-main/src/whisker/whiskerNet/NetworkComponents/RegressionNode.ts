import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class RegressionNode extends NodeGene {

    /**
     * The ScratchEvent for which this regression node is determining a value for a specified parameter.
     */
    private readonly _event: ScratchEvent

    /**
     * The ScratchEvent parameter this regression node produces values for.
     */
    private readonly _eventParameter: string

    /**
     * Constructs a new regression Node.
     * @param event the event for which this regression node produces values for.
     * @param eventParameter specifies the parameter of the event this regression node produces values for.
     * @param activationFunction the activation function of the regression node.
     * @param incrementIDCounter flag determining whether the uID counter should be increased after constructing a
     * new regression node.

     */
    constructor(event: ScratchEvent, eventParameter: string, activationFunction: ActivationFunction,
                incrementIDCounter = true) {
        super(activationFunction, NodeType.OUTPUT, incrementIDCounter);
        this._event = event;
        this._eventParameter = eventParameter;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof RegressionNode)) return false;
        return this.uID === other.uID
            && this.event.stringIdentifier() === other.event.stringIdentifier()
            && this.eventParameter === other.eventParameter
            && this.activationFunction === other.activationFunction;
    }

    clone(): RegressionNode {
        const clone = new RegressionNode(this.event, this.eventParameter,
            this.activationFunction, false);
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
     * Calculates the activation value of the regression node based on the node value and the activation function.
     * @returns number activation value of the regression node.
     */
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

    get event(): ScratchEvent {
        return this._event;
    }

    toString(): string {
        return `RegressionNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, ActivationFunction: ${this.activationFunction}\
, InputConnections: ${this.incomingConnections}\
, Event: ${this.event.stringIdentifier()}\
, Parameter ${this.eventParameter}}`;
    }

    /**
     * Transforms this NodeGene into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | string)> {
        const node = {}
        node[`id`] = this.uID;
        node[`t`] = "R";
        node[`aF`] = ActivationFunction[this.activationFunction];
        node[`event`] = this._event.stringIdentifier();
        node['eventP'] = this._eventParameter;
        return node;
    }

}
