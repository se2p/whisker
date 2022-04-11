import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class ClassificationNode extends NodeGene {

    /**
     * The ScratchEvent this classification node is representing.
     */
    private readonly _event: ScratchEvent

    /**
     * Constructs a new classification Node.
     * @param uID the unique identifier of this node in the network.
     * @param activationFunction the activation function of the classification node.
     * @param event the ScratchEvent this Classification node is representing.
     */
    constructor(uID: number, event: ScratchEvent, activationFunction: ActivationFunction) {
        super(uID, activationFunction, NodeType.OUTPUT);
        this._event = event;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof ClassificationNode)) return false;
        return this.event.stringIdentifier() === other.event.stringIdentifier() &&
            this.activationFunction === other.activationFunction;
    }

    clone(): ClassificationNode {
        const clone = new ClassificationNode(this.uID, this.event, this.activationFunction);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.lastActivationValue = this.lastActivationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * Calculates the activation value of the classification node based on the node value and the activation function.
     * @returns number activation value of the classification node.
     */
    activate(): number {
        if (this.activatedFlag) {
            switch (this.activationFunction) {
                case ActivationFunction.SIGMOID:
                    // The specified gain value of -4.9 is based on the original NEAT publication.
                    this.activationValue = NeuroevolutionUtil.sigmoid(this.nodeValue, 1);
                    break;
                case ActivationFunction.TANH:
                    this.activationValue = Math.tanh(this.nodeValue);
                    break;
                default:
                    this.activationValue = this.nodeValue;
                    break;
            }
            return this.activationValue;
        } else
            return 0.0;
    }

    public identifier(): string {
        return `C:${this.event.stringIdentifier()}`;
    }

    toString(): string {
        return `ClassificationNode{ID: ${this.uID}\
, Value: ${this.activationValue}\
, InputConnections: ${this.incomingConnections}}`;
    }

    /**
     * Transforms this Classification Node into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | string)> {
        const node = {};
        node[`id`] = this.uID;
        node[`t`] = "C";
        node[`aF`] = ActivationFunction[this.activationFunction];
        node[`event`] = this.event.stringIdentifier();
        return node;
    }

    get event(): ScratchEvent {
        return this._event;
    }
}
