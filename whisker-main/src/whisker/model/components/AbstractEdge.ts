import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {getTimeLimitFailedAfterOutput, getTimeLimitFailedAtOutput} from "../util/ModelError";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {UserModelEdge} from "./UserModelEdge";
import {ModelEdgeJSON} from "../util/schema";
import {Check, Condition} from "../checks/newCheck";
import VMWrapper from "../../../vm/vm-wrapper";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

export type ModelEdge =
    | ProgramModelEdge
    | UserModelEdge
    ;

/**
 * Super type for the edges. All edge types have their id, the conditions and start and end node in common (defined
 * here).
 */
export abstract class AbstractEdge {
    readonly id: string;
    readonly label: string;
    readonly graphID: string;

    /* Id of the source node */
    readonly from: string;
    /* Id of the target node*/
    readonly to: string;
    readonly forceAfter: number;
    readonly forceAt: number;
    conditions: Condition[] = [];
    private readonly _forceAfterSteps: number;
    private readonly _forceAtSteps: number;

    protected constructor(id: string, label: string, graphID: string, from: string, to: string, forceTestAfter: number,
                          forceTestAt: number) {
        if (!id) {
            throw new Error("No id given.");
        }
        this.id = id;
        this.label = label;
        this.graphID = graphID;
        this.from = from;
        this.to = to;
        this.forceAfter = Math.max(-1, forceTestAfter);
        this._forceAfterSteps = this._convertTimeToSteps(this.forceAfter);
        this.forceAt = Math.max(-1, forceTestAt);
        this._forceAtSteps = this._convertTimeToSteps(this.forceAt);
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @param t Instance of the test driver
     * @param cu Check listener instance for error and fail outputs.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     * @Returns the failed conditions.
     */
    checkConditions(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number): boolean {
        // times up... force testing of conditions and if they are not fulfilled make add as failed
        if (this._mustForceStart(t) || this._mustForceLastTransition(stepsSinceLastTransition)) {
            let noneFailed = true;
            for (const c of this.conditions) {
                try {
                    const res = c.check(stepsSinceLastTransition, stepsSinceEnd);
                    if (res.passed === false) {
                        noneFailed = false;
                        cu.addTimeLimitFailOutput(this._getTimeLimitFailedOutput(c, t), res.reason);
                    }
                } catch (e) {
                    cu.addErrorOutput(this.label, this.graphID, e);
                    noneFailed = false;
                }
            }
            return noneFailed;
        }

        // time limit not reached
        for (const c of this.conditions) {
            try {
                if (!c.check(stepsSinceLastTransition, stepsSinceEnd).passed) {
                    return false;
                }
            } catch (e) {
                cu.addErrorOutput(this.label, this.graphID, e);
                return false;
            }
        }

        return true;
    }

    abstract checkConditionsOnEvent(stepsSinceLastTransition: number, stepsSinceEnd: number): boolean;

    /**
     * Returns the id of the target node of this edge.
     */
    getEndNodeId(): string {
        return this.to;
    }

    /**
     * Add a condition to the edge. Conditions in the evaluation all need to be fulfilled for the effect to be valid.
     * @param condition Condition function as a string.
     */
    addCondition(condition: Condition): void {
        this.conditions.push(condition);
    }

    /**
     * Register the check listener and test driver on the edge's conditions.
     */
    registerComponents(checkListener: CheckUtility, t: TestDriver, newTarget: RenderedTarget | null = null): void {
        this.conditions.forEach(cond => {
            cond.registerComponents(t, checkListener, this.graphID, newTarget);
        });
    }

    /**
     * Returns the readable label of this edge if it exists, appended with some characters from its id to make it unique
     * If the label is empty the id is used instead.
     * This is just likely to be unique, not 100% guaranteed. If uniqueness is important, use the full id instead.
     */
    getReadableId(): string{
        if(this.label === ""){
            return this.id;
        } else {
            return `${this.label}_${this.id.substring(0,4)}`;
        }
    }

    abstract toJSON(): ModelEdgeJSON;

    private _getTimeLimitFailedOutput(condition: Check, t: TestDriver): string {
        if (this._forceAtSteps != -1 && this._forceAtSteps <= t.getTotalStepsExecuted()) {
            return getTimeLimitFailedAtOutput(this, condition, this.forceAt);
        } else {
            return getTimeLimitFailedAfterOutput(this, condition, this.forceAfter);
        }
    }

    private _mustForceStart(t: TestDriver): boolean {
        return this._forceAtSteps !== -1 && this._forceAtSteps <= t.getTotalStepsExecuted();
    }

    private _mustForceLastTransition(stepsSinceLastTransition: number): boolean {
        return this._forceAfterSteps !== -1 && this._forceAfterSteps <= stepsSinceLastTransition;
    }

    private _convertTimeToSteps(value: number): number {
        return value === -1 ? -1 : VMWrapper.convertFromTimeToSteps(value);
    }
}
