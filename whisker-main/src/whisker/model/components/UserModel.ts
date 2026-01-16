import {UserModelNode} from "./ModelNode";
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
    public static readonly NO_DURATION = -1;
    private readonly _maxDuration: number;

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
     * @param maxDuration Maximum duration for running this UserModel
     */
    constructor(id: string, startNodeId: string, nodes: Record<string, UserModelNode>, edges: Record<string, UserModelEdge>,
                stopAllNodeIds: string[], initialStorage: Record<string, StorageValueType>, maxDuration = UserModel.NO_DURATION) {
        super(id, startNodeId, nodes, edges, stopAllNodeIds, initialStorage);
        this._maxDuration = maxDuration;
    }

    override get usage(): "user" {
        return "user";
    }

    get hasMaxDuration(): boolean {
        return this._maxDuration !== UserModel.NO_DURATION;
    }

    get maxDuration(): number {
        return this._maxDuration;
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
            maxDuration: this._maxDuration,
        };
    }
}
