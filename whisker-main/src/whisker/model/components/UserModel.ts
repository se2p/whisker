import {UserModelNode} from "./ModelNode";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {AbstractModel} from "./AbstractModel";
import {UserModelEdge} from "./UserModelEdge";
import {StorageValueType, UserModelJSON} from "../util/schema";

/**
 *  Graph structure for a user model representing the user's behaviour when playing a Scratch program.
 *
 * ############# Assumptions ##################
 * - Only one start node, unique
 * - Does not need a stop node.
 * - A stop node stops the model it belongs to.
 * - A stop all node stops all models of this type.
 * - Each edge has a condition (input event, condition for a variable,....) -> or at least an always true condition
 * - Input effects are immediate inputs in the step the condition holds.
 * - Conditions should exclude each other so only one edge can be taken at one step. The first matching one is
 * taken. So that it not gets ambiguous.
 */
export class UserModel extends AbstractModel<UserModelEdge> {
    stepNbrOfProgramEnd = 0;

    /**
     * Construct a user model (graph) with a string identifier. This model acts as a user playing/using the Scratch
     * program and provides inputs for the program.
     *
     * @param id ID of the model.
     * @param startNodeId Id of the start node
     * @param nodes Dictionary mapping the node ids to the actual nodes in the graph.
     * @param edges Dictionary mapping the edge ids to the actual edges in the graph.
     * @param stopAllNodeIds Ids of the nodes that stop all models on reaching them.
     * @param initialStorage Initial values of the graph storage before the execution starts
     */
    constructor(id: string, startNodeId: string, nodes: Record<string, UserModelNode>, edges: Record<string, UserModelEdge>,
                stopAllNodeIds: string[], initialStorage: Record<string, StorageValueType>) {
        super(id, startNodeId, nodes, edges, stopAllNodeIds, initialStorage);
    }

    /**
     * Simulate transitions on the graph. Edges are tested only once if they are reached.
     */
    override makeOneTransition(testDriver: TestDriver, checkUtility: CheckUtility): UserModelEdge | null {
        const stepsSinceLastTransition = testDriver.getTotalStepsExecuted() - this.lastTransitionStep;
        const edge = this.currentState.testEdgeConditions(testDriver, checkUtility, stepsSinceLastTransition,
            this.stepNbrOfProgramEnd);

        if (edge == null) {
            return null;
        }

        this.currentState = this.nodes[edge.getEndNodeId()];
        this.secondLastTransitionStep = this.lastTransitionStep;
        this.lastTransitionStep = testDriver.getTotalStepsExecuted() + 1;

        return edge;
    }

    /**
     * Whether the model is in a stop state.
     */
    stopped(): boolean {
        return this.currentState.isStopNode;
    }

    /**
     * Reset the graph to the start state.
     */
    reset(): void {
        this.currentState = this.nodes[this.startNodeId];
        this.lastTransitionStep = 0;
        this.secondLastTransitionStep = 0;
        Object.values(this.nodes).forEach(node => {
            node.reset();
        });
    }

    /**
     * Register the check listener and test driver on all node's edges.
     */
    override registerComponents(checkListener: CheckUtility, testDriver: TestDriver): void {
        super.registerComponents(checkListener, testDriver);
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver);
        });
    }

    setTransitionsStartTo(steps: number): void {
        this.lastTransitionStep = steps;
        this.secondLastTransitionStep = steps;
    }

    override get usage(): "user" {
        return "user";
    }

    override toJSON(): UserModelJSON {
        return {
            usage: this.usage,
            id: this.id,
            startNodeId: this.startNodeId,
            stopAllNodeIds: this.stopAllNodeIds,
            nodes: Object.values(this.nodes).map((node) => node.toJSON()),
            edges: Object.values(this.edges).map((edge) => edge.toJSON()),
            initialStorage: this.initialStorage,
        };
    }
}
