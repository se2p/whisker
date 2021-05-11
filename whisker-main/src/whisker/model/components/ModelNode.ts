import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";
import {CheckListener} from "../util/CheckListener";

/**
 * Node structure for a model.
 */
export class ModelNode {

    private readonly id: string;
    outgoing: ModelEdge[] = [];

    isStartNode = false;
    isStopNode = false;

    /**
     * Node of a graph with an unique id identifier.
     * @param id
     */
    constructor(id: string) {
        this.id = id;
    }

    /**
     * Add an outgoing edge from this model node.
     * @param edge Edge to add.
     */
    addOutgoingEdge(edge: ModelEdge): void {
        this.outgoing.push(edge);
    }

    /**
     * Returns an model edge if one has its conditions for traversing the edge fulfilled or else null.
     */
    testEdgeConditions(testDriver: TestDriver, modelResult: ModelResult): ModelEdge {
        if (this.outgoing.length == 0) {
            return null;
        }

        for (let i = 0; i < this.outgoing.length; i++) {
            const result = this.outgoing[i].checkConditions(testDriver, modelResult);
            if (result && result.length == 0) {
                return this.outgoing[i];
            }
        }

        return null;
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckListener, testDriver: TestDriver, result: ModelResult) {
        this.outgoing.forEach(edge => {
            edge.registerComponents(checkListener, testDriver, result);
        })
    }

    reset() {
        this.outgoing.forEach(edge => {
            edge.reset();
        })
    }
}
