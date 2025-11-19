import {ModelNode} from "./ModelNode";
import {ModelEdge} from "./AbstractEdge";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {UserModel} from "./UserModel";
import {EndModel, ProgramModel} from "./ProgramModel";
import {ModelJSON, ModelUsage, StorageValueType} from "../util/schema";
import {evaluateExpression, getExpressionForEval, initialiseStorage} from "../util/ModelUtil";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export type OracleModel =
    | ProgramModel
    | EndModel
    ;

export type Model =
    | UserModel
    | OracleModel
    ;

export abstract class AbstractModel<E extends ModelEdge> {
    public static readonly initialStepValue = -1;
    currentState: ModelNode<E>;
    programEndStep = 0;
    protected readonly startNodeId: string;
    protected readonly stopAllNodeIds: string[];
    protected readonly nodes: Record<string, ModelNode<E>>;
    protected readonly edges: Record<string, E>;
    protected readonly initialStorage: Record<string, StorageValueType>;
    protected _lastTransitionStep: number;
    private readonly _id: string;

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
        this.reset();
    }

    get lastTransitionStep(): number {
        return this._lastTransitionStep;
    }

    get id(): string {
        return this._id;
    }

    abstract get usage(): ModelUsage;

    setTransitionsStartTo(steps: number): void {
        this._lastTransitionStep = steps;
    }

    makeOneTransition(t: TestDriver, checkUtility: CheckUtility): [E, number] | null {
        if (this.stopped()) {
            return null;
        }
        const stepsSinceLastTransition = this.stepsSinceLastTransition(t);
        const edge = this.currentState.testEdgeConditions(t, checkUtility, stepsSinceLastTransition, this.programEndStep);

        if (edge == null) {
            return null;
        }

        this._takeEdge(edge, t);
        return [edge, stepsSinceLastTransition];
    }

    abstract toJSON(): ModelJSON;

    public stepsSinceLastTransition(t: TestDriver): number {
        return t.getTotalStepsExecuted() - this._lastTransitionStep;
    }

    stopped(): boolean {
        return this.currentState.isStopNode;
    }

    restart(currentStep: number): void {
        this.currentState = this.nodes[this.startNodeId];
        this._lastTransitionStep = currentStep - 1;
    }

    reset(currentStep = 0): void {
        this.restart(currentStep);
    }

    /**
     * Initializes the storage for this model
     */
    registerComponents(checkListener: CheckUtility, testDriver: TestDriver, newTarget: RenderedTarget | null = null): void {
        // even if no initial storage is provided, the storage still must be reset
        const initialStorage = new Map<string, unknown>();
        initialiseStorage(this.id, initialStorage);

        for (const [key, [type, value]] of Object.entries(this.initialStorage)) {
            if (type === "number" || type === "string") {
                initialStorage.set(key, value);
            } else {
                const exprString = Array.isArray(value) ? value.join("\n") : value;
                const expr = getExpressionForEval(testDriver, exprString, this._id).expr;
                initialStorage.set(key, evaluateExpression(testDriver, expr, this._id));
            }
        }
        Object.values(this.nodes).forEach(node => {
            node.registerComponents(checkListener, testDriver, newTarget);
        });
    }

    protected _takeEdge(edge: E, testDriver: TestDriver): void {
        this.currentState = this.nodes[edge.getEndNodeId()];
        this._lastTransitionStep = testDriver.getTotalStepsExecuted();
    }
}
