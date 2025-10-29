import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./AbstractEdge";
import {CheckUtility} from "../util/CheckUtility";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {UserModelEdge} from "./UserModelEdge";
import {ModelNodeJSON} from "../util/schema";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

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
            if (result) {
                return e;
            }
        }
        return null;
    }

    /**
     * Check the edges for a transition based on fired events.
     */
    testForEvent(stepsSinceLastTransition: number, stepsSinceEnd: number): void {
        for (const e of this.edges) {
            try {
                if (e.checkConditionsOnEvent(stepsSinceLastTransition, stepsSinceEnd)) { // cache results
                    return; // this edges will be taken later anyway so there is no point in caching for the remaining edges
                }
            } catch (e) {
                // something failed but this is not important here, because this method is only for caching anyway
            }
        }
    }

    /**
     * Register the check listener and test driver.
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, newTarget: RenderedTarget | null = null): void {
        this.edges.forEach(edge => {
            edge.registerComponents(checkListener, testDriver, newTarget);
        });
    }

    toJSON(): ModelNodeJSON {
        return {
            id: this.id,
            label: this.label
        };
    }
}
