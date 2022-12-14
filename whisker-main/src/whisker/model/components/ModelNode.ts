import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {CheckUtility} from "../util/CheckUtility";

/**
 * Node structure for a model.
 */
export class ModelNode {
    readonly id: string;
    readonly label: string;
    edges: ModelEdge[] = []; //outgoing edges

    isStartNode = false;
    isStopNode = false;
    isStopAllNode = false;

    /**
     * Node of a graph with an unique id identifier.
     * @param id Id of the node
     * @param label Label of the node
     */
    constructor(id: string, label: string) {
        if (!id) {
            throw new Error("No id given.");
        }
        this.id = id;
        if (label == undefined) {
            this.label = id;
        } else {
            this.label = label;
        }
    }

    /**
     * Add an outgoing edge from this model node.
     * @param edge Edge to add.
     */
    addOutgoingEdge(edge: ModelEdge): void {
        if (edge.from != this.id) {
            throw new Error("Edge start node id not from this node.");
        }
        this.edges.push(edge);
    }

    /**
     * Returns an model edge if one has its conditions for traversing the edge fulfilled or else null.
     * @param testDriver Instance of the test driver.
     * @param cu Check listener.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    testEdgeConditions(testDriver: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number,
                       stepsSinceEnd: number): ModelEdge {

        // get all edges that have not failing conditions and check for order of events
        for (let i = 0; i < this.edges.length; i++) {
            const result = this.edges[i].checkConditions(testDriver, cu, stepsSinceLastTransition, stepsSinceEnd);

            if (result && result.length == 0) {
                this.edges[i].lastTransition = testDriver.getTotalStepsExecuted() + 1;
                return this.edges[i];
            }
        }
        return null;
    }

    /**
     * Check the edges for a transition based on fired events.
     */
    testForEvent(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number,
                 eventStrings: string[]) {
        for (let i = 0; i < this.edges.length; i++) {
            const result = this.edges[i].checkConditionsOnEvent(t, cu, stepsSinceLastTransition, stepsSinceEnd,
                eventStrings);

            if (result && result.length == 0) {
                this.edges[i].lastTransition = t.getTotalStepsExecuted() + 1;
                return this.edges[i];
            }
        }
        return null;
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, caseSensitive: boolean) {
        this.edges.forEach(edge => {
            edge.registerComponents(checkListener, testDriver, caseSensitive);
        });
    }

    /**
     * Reset all edge's states that belong to one test run.
     */
    reset() {
        this.edges.forEach(edge => {
            edge.reset();
        });
    }

    simplifyForSave() {
        return {
            id: this.id,
            label: this.label
        };
    }
}
