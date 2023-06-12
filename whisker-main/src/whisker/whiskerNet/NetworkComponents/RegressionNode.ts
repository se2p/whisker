import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../Misc/NeuroevolutionUtil";
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
     * @param uID the unique identifier of this node in the network.
     * @param event the event for which this regression node produces values for.
     * @param eventParameter specifies the parameter of the event this regression node produces values for.
     */
    constructor(uID: number, event: ScratchEvent, eventParameter: string) {

        // Determine activation function based on the event that will be supplied with parameter.
        let activationFunction: ActivationFunction;
        switch (event.toJSON()['type']) {
            case "WaitEvent":
            case "KeyPressEvent":
            case "MouseDownForStepsEvent":
                activationFunction = ActivationFunction.SIGMOID;
                break;
            case "MouseMoveEvent":
                activationFunction = ActivationFunction.TANH;
                break;
            default:
                activationFunction = ActivationFunction.NONE;
        }

        super(uID, 1, activationFunction, NodeType.OUTPUT);
        this._event = event;
        this._eventParameter = eventParameter;
    }

    /**
     * Two regression nodes are equal if they represent the same parameter of an output event.
     * @param other the node to compare this node to.
     */
    equals(other: unknown): boolean {
        if (!(other instanceof RegressionNode)) return false;
        return this.event.stringIdentifier() === other.event.stringIdentifier()
            && this.eventParameter === other.eventParameter;
    }

    clone(): RegressionNode {
        const clone = new RegressionNode(this.uID, this.event, this.eventParameter);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * Calculates the activation value of the regression node based on the node value and the activation function.
     * @returns number activation value of the regression node.
     */
    activate(): number {
        if (this.activatedFlag) {
            switch (this.activationFunction) {
                case ActivationFunction.RELU:
                    return NeuroevolutionUtil.relu(this.nodeValue);
                case ActivationFunction.NONE:
                    return this.nodeValue;
                case ActivationFunction.TANH:
                    return Math.tanh(this.nodeValue);
                case ActivationFunction.SIGMOID:
                default:
                    return NeuroevolutionUtil.sigmoid(this.nodeValue, 1);
            }
        } else
            return 0.0;
    }

    get eventParameter(): string {
        return this._eventParameter;
    }

    get event(): ScratchEvent {
        return this._event;
    }

    /**
     * Regression nodes are identified by their type and represented event parameter.
     * @returns identifier based on the node type and represented event parameter.
     */
    public identifier(): string {
        return `R:${this.event.stringIdentifier()}-${this.eventParameter}`;
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
        const node = {};
        node['id'] = this.uID;
        node['t'] = "R";
        node['aF'] = ActivationFunction[this.activationFunction];
        node['event'] = this._event.stringIdentifier();
        node['eventP'] = this._eventParameter;
        node['d'] = this.depth;
        return node;
    }

}
