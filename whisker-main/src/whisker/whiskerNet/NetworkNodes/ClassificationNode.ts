import {NodeGene} from "./NodeGene";
import {ActivationFunction} from "./ActivationFunction";
import {NodeType} from "./NodeType";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class ClassificationNode extends NodeGene {

    /**
     * The Scratch-Event this classification node handles.
     */
    private readonly _event: ScratchEvent

    /**
     * Constructs a new classification Node
     * @param id the identification number of the node within the network
     * @param event the Scratch-Event this node handles
     * @param activationFunction the activation function of the classification node
     */
    constructor(id: number, event: ScratchEvent, activationFunction: ActivationFunction) {
        super(id, activationFunction, NodeType.OUTPUT);
        this._event = event;
        this.nodeValue = 0;
        this.lastActivationValue = 0;
        this.activationValue = 0;
    }

    equals(other: unknown): boolean {
        if (!(other instanceof ClassificationNode)) return false;
        return this.id === other.id &&
            this.event.stringIdentifier() === other.event.stringIdentifier() &&
            this.activationFunction === other.activationFunction;
    }

    clone(): ClassificationNode {
        return new ClassificationNode(this.id, this.event, this.activationFunction)

    }

    getActivationValue(): number {
        if (this.activationCount > 0) {
            switch (this.activationFunction) {
                case ActivationFunction.SIGMOID:
                    this.activationValue = NeuroevolutionUtil.sigmoid(this.nodeValue, -4.9);
                    break;
                default:
                    this.activationValue = this.nodeValue;
                    break;
            }
            return this.activationValue;
        } else
            return 0.0;
    }

    toString(): string {
        return `ClassificationNode{ID: ${this.id}\
, Value: ${this.activationValue}\
, InputConnections: ${this.incomingConnections}}`;
    }

    /**
     * Transforms this Classification Node into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | string)> {
        const node = {}
        node[`id`] = this.id;
        node[`type`] = "CLASSIFICATION";
        node[`activationFunction`] = ActivationFunction[this.activationFunction];
        node[`event`] = this.event.stringIdentifier();
        return node;
    }

    get event(): ScratchEvent {
        return this._event;
    }
}
