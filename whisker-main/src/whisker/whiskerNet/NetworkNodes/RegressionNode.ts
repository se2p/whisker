import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class RegressionNode extends NodeGene {

    /**
     * The event this regression node serves.
     */
    private readonly _event: ScratchEvent

    /**
     * The event parameter this regression node produces values for
     */
    private readonly _eventParameter: string

    /**
     * Constructs a new regression Node
     * @param id the identification number of the node within the network
     * @param event the event to which this regression node produces values for
     * @param eventParameter specifies the parameter of the given event, this node produces values for
     * @param activationFunction the activation function of the regression node
     */
    constructor(id: number, event: ScratchEvent, eventParameter: string, activationFunction: ActivationFunction) {
        super(id, activationFunction, NodeType.OUTPUT);
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
        this._event = event;
        this._eventParameter = eventParameter;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof RegressionNode)) return false;
        return this.id === other.id
            && this.eventParameter === other.eventParameter
            && this.event.stringIdentifier() === other.event.stringIdentifier()
            && this.activationFunction === other.activationFunction;
    }

    clone(): RegressionNode {
        return new RegressionNode(this.id, this.event, this.eventParameter, this.activationFunction)
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

    get event(): ScratchEvent {
        return this._event;
    }

    toString(): string {
        return `RegressionNode{ID: ${this.id}\
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
        node[`id`] = this.id;
        node[`t`] = "R";
        node[`aF`] = ActivationFunction[this.activationFunction];
        node[`event`] = this._event.stringIdentifier();
        node['eventP'] = this._eventParameter;
        return node;
    }

}
