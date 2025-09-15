import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./AbstractEdge";
import {CheckUtility} from "../util/CheckUtility";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {UserModelEdge} from "./UserModelEdge";
import {ModelNodeJSON} from "../util/schema";
import {Checks} from "../util/Checks";

export type ProgramModelNode = ModelNode<ProgramModelEdge>;
export type UserModelNode = ModelNode<UserModelEdge>;

/**
 * Node structure for a model.
 */
export class ModelNode<E extends ModelEdge = ModelEdge> {
    readonly id: string;
    readonly label: string;
    edges: E[] = []; //outgoing edges

    private readonly _isStopAllNode: boolean;

    /**
     * Node of a graph with a unique id identifier.
     * @param id Id of the node
     * @param label Label of the node
     * @param isStopAllNode Flag if this node is a stopping node for all active graphs
     */
    constructor(id: string, label: string = id, isStopAllNode = false) {
        if (!id) {
            throw new Error("No id given.");
        }

        this.id = id;
        this.label = label;
        this._isStopAllNode = isStopAllNode;
    }

    public get isStopNode(): boolean {
        return this.edges.length === 0;
    }

    public get isStopAllNode(): boolean {
        return this._isStopAllNode;
    }

    /**
     * Add an outgoing edge from this model node.
     * @param edge Edge to add.
     */
    addOutgoingEdge(edge: E): void {
        if (edge.from != this.id) {
            throw new Error(`Edge start node id not from this node (expected: ${this.id}, actual: ${edge.from}).`);
        }

        if (this._isStopAllNode) {
            throw new Error(`Cannot add outgoing edge to a stop all node (node id: ${this.id}).`);
        }

        this.edges.push(edge);
    }

    /**
     * Returns a model edge if one has its conditions for traversing the edge fulfilled or else null.
     * @param testDriver Instance of the test driver.
     * @param cu Check listener.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    testEdgeConditions(testDriver: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number,
                       stepsSinceEnd: number): E | null {

        // get all edges that have not failing conditions and check for order of events
        for (const e of this.edges) {
            const result = e.checkConditions(testDriver, cu, stepsSinceLastTransition, stepsSinceEnd);
            if (result && result.length == 0) {
                e.lastTransition = testDriver.getTotalStepsExecuted() + 1;
                return e;
            }
        }
        return null;
    }

    /**
     * Check the edges for a transition based on fired events.
     */
    testForEvent(stepsSinceLastTransition: number, stepsSinceEnd: number, checks: Checks): void{
        this.edges.forEach(e => e.checkConditionsOnEvent(stepsSinceLastTransition, stepsSinceEnd, checks)); // cache results
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver): void {
        this.edges.forEach(edge => {
            edge.registerComponents(checkListener, testDriver);
        });
    }

    /**
     * Reset all edge's states that belong to one test run.
     */
    reset(): void {
        this.edges.forEach(edge => {
            edge.reset();
        });
    }

    toJSON(): ModelNodeJSON {
        return {
            id: this.id,
            label: this.label
        };
    }
}
