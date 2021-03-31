import {ModelEdge} from "./ModelEdge";

/**
 * Node structure for a model todo
 */
export class ModelNode {

    private id: number;
    private outgoing: ModelEdge[];

    constructor(id: number) {
        this.id = id;
    }

    setOutgoingEdges(outgoing: ModelEdge[]): void {
        this.outgoing = outgoing;
    }

    addOutgoingEdge(edge: ModelEdge): void {
        this.outgoing.push(edge); // todo is the order important?
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
