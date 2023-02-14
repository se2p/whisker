import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeuroevolutionUtil} from "../Misc/NeuroevolutionUtil";

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
        super(uID, 1, activationFunction, NodeType.OUTPUT);
        this._event = event;
    }

    /**
     * Two classification nodes are equal if they represent the same output event.
     * @param other the node to compare this node to.
     */
    equals(other: unknown): boolean {
        if (!(other instanceof ClassificationNode)) return false;
        return this.event.stringIdentifier() === other.event.stringIdentifier();
    }

    clone(): ClassificationNode {
        const clone = new ClassificationNode(this.uID, this.event, this.activationFunction);
        clone.nodeValue = this.nodeValue;
        clone.activationValue = this.activationValue;
        clone.activationCount = this.activationCount;
        clone.activatedFlag = this.activatedFlag;
        clone.traversed = this.traversed;
        return clone;
    }

    /**
     * On classification nodes we apply softmax activation.
     * @params softmaxDenominator the denominator required for the softmax function.
     * @returns softmax activation based on the given node value and the supplied denominator.
     */
    activate(softMaxDenominator:number): number {
        switch (this.activationFunction){
            case ActivationFunction.SIGMOID:
                return NeuroevolutionUtil.sigmoid(this.nodeValue, 1);
            case ActivationFunction.SOFTMAX:
            default:
                return Math.exp(this.nodeValue) / softMaxDenominator;
        }
    }

    /**
     * Classification nodes are identified by their type and represented event.
     * @returns identifier based on the node type and represented event.
     */
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
        node['id'] = this.uID;
        node['t'] = "C";
        node['aF'] = ActivationFunction[this.activationFunction];
        node['event'] = this.event.stringIdentifier();
        node['d'] = this.depth;
        return node;
    }

    get event(): ScratchEvent {
        return this._event;
    }
}
