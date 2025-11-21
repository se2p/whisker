import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../misc/NeuroevolutionUtil";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";

/**
 * Event nodes are placed in the final layer of a network and used in a multi-label classification problem to
 * determine which actions should be executed given the current state of the program.
 */
export class ActionNode extends NodeGene {

    /**
     * Constructs a new event Node.
     * @param uID the unique identifier of this node in the network.
     * @param activationFunction the activation function used in this output gene.
     * @param _event the event for which this regression node produces values for.
     * @param _continuous whether the event is performed continuously (mouse move) or triggered (key press).
     */
    constructor(uID: number, activationFunction: ActivationFunction.SIGMOID | ActivationFunction.SOFTMAX,
                private readonly _event: ScratchEvent, private readonly _continuous: boolean = false) {
        // Continuous events are always sigmoid activated.
        const activationFunc = _continuous ? ActivationFunction.SIGMOID : activationFunction;
        super(uID, 1, activationFunc, NodeType.OUTPUT);
    }

    /**
     * Two event nodes are equal if they represent the same parameter of an output event.
     * @param other the node to compare this node to.
     */
    equals(other: unknown): boolean {
        if (!(other instanceof ActionNode)) return false;
        return this.event.stringIdentifier() === other.event.stringIdentifier();
    }

    clone(): ActionNode {
        const clone = new ActionNode(this.uID, this.activationFunction, this.event, this.continuous);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * Calculates the activation value of the event node using the sigmoid activation function.
     * @returns activation value after applying the sigmoid activation function.
     */
    activate(nodeValues: number[]): number {
        if (!this.activatedFlag) {
            return 0.0;
        }
        if (this.activationFunction === ActivationFunction.SIGMOID) {
            return NeuroevolutionUtil.sigmoid(this.nodeValue, 1);
        } else {
            return NeuroevolutionUtil.softMax(this.nodeValue, nodeValues);
        }
    }

    get event(): ScratchEvent {
        return this._event;
    }

    get continuous(): boolean {
        return this._continuous;
    }

    /**
     * Event nodes are represented by their corresponding event.
     * @returns identifier based on the represented event.
     */
    public identifier(): string {
        return `A:${this.event.stringIdentifier()}`;
    }

    toString(): string {
        return `EventNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, ActivationFunction: ${this.activationFunction}\
, InputConnections: ${this.incomingConnections}\
, Event: ${this.event.stringIdentifier()}`;
    }

    /**
     * Transforms this NodeGene into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | string)> {
        const node = {};
        node['id'] = this.uID;
        node['t'] = "A";
        node['event'] = this._event.stringIdentifier();
        node['d'] = this.depth;
        node['aF'] = ActivationFunction[this.activationFunction];
        return node;
    }

}
