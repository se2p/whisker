import {ModelEdge} from "./ModelEdge";

/**
 * Node structure for a model.
 */
export class ModelNode {

    private id: string;
    private outgoing: ModelEdge[] = [];

    isStartNode = false;
    isStopNode = false;

    constructor(id: string) {
        this.id = id;
    }

    setOutgoingEdges(outgoing: ModelEdge[]): void {
        this.outgoing = outgoing;
    }

    addOutgoingEdge(edge: ModelEdge): void {
        this.outgoing.push(edge);
    }

    /**
     * Return all
     * @param event
     */
    getEdgeForInputEvent(event): ModelEdge { // todo type for input event
        if (this.outgoing.length == 0) {
            return null;
        }

        // todo find edge in edge list that has the event as condition
        return this.outgoing[0];
    }
}
