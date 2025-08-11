import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./AbstractEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {UserModel} from "./UserModel";
import {EndModel, ProgramModel} from "./ProgramModel";
import {ModelJSON, ModelUsage, StorageValueType} from "../util/schema";
import {ModelUtil} from "../util/ModelUtil";

export type Model =
    | UserModel
    | ProgramModel
    | EndModel
    ;

export abstract class AbstractModel<E extends ModelEdge> {
    private readonly _id: string;

    protected readonly startNodeId: string;
    protected readonly stopAllNodeIds: string[];

    protected readonly nodes: Record<string, ModelNode<E>>;
    protected readonly edges: Record<string, E>;

    protected readonly initialStorage: Record<string, StorageValueType>;

    currentState: ModelNode<E>;
    lastTransitionStep = 0;
    secondLastTransitionStep = 0;

    protected constructor(id: string, startNodeId: string, nodes: Record<string, ModelNode<E>>, edges: Record<string, E>,
                          stopAllNodeIds: string[], initialStorage: Record<string, StorageValueType>) {
        if (!id) {
            throw new Error("No id given.");
        }
        if (!startNodeId || !nodes[startNodeId]) {
            throw new Error("No start node (id or in node set) given.");
        }
        this._id = id;
        this.currentState = nodes[startNodeId];
        this.nodes = nodes;
        this.edges = edges;
        this.startNodeId = startNodeId;
        this.stopAllNodeIds = stopAllNodeIds;
        this.initialStorage = initialStorage;
    }

    abstract makeOneTransition(t: TestDriver, checkUtility: CheckUtility): E | null;

    abstract toJSON(): ModelJSON;

    get id(): string {
        return this._id;
    }

    abstract get usage(): ModelUsage;

    /**
     * Initializes the storage for this model
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver): void {
        // even if no initial storage is provided, the storage still must be reset
        const initialStorage = new Map<string, unknown>();
        ModelUtil.initialiseStorage(this.id, initialStorage);

        for (const [key, [type, value]] of Object.entries(this.initialStorage)) {
            if (type === "number" || type === "string") {
                initialStorage.set(key, value);
            } else {
                const exprString = Array.isArray(value) ? value.join("\n") : value;
                const expr = ModelUtil.getExpressionForEval(testDriver, exprString, this._id).expr;
                initialStorage.set(key, ModelUtil.evaluateExpression(testDriver, expr, this._id));
            }
        }
    }
}
