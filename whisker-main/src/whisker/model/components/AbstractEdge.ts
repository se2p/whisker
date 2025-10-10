import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {getTimeLimitFailedAfterOutput, getTimeLimitFailedAtOutput} from "../util/ModelError";
import {ProgramModelEdge} from "./ProgramModelEdge";
import {UserModelEdge} from "./UserModelEdge";
import {ModelEdgeJSON} from "../util/schema";
import {Check, Condition} from "../checks/newCheck";
import VMWrapper from "../../../vm/vm-wrapper";
import {AbstractModel} from "./AbstractModel";
import {Reason} from "../checks/CheckResult";

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
    conditions: Condition[] = [];
    readonly forceTestAfter: number;
    readonly forceTestAt: number;
    protected failedForcedTest: boolean;
    _lastTransition: number;
    private _forceTestAfterSteps: number;
    private _forceTestAtSteps: number;

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
        this.forceTestAfter = forceTestAfter;
        if (this.forceTestAfter < -1) {
            this.forceTestAfter = -1;
        } else if (this.forceTestAfter != -1) {
            this.forceTestAfter = forceTestAfter;
        }
        this.forceTestAt = forceTestAt;
        if (this.forceTestAt < -1) {
            this.forceTestAt = -1;
        } else if (this.forceTestAt != -1) {
            this.forceTestAt = forceTestAt;
        }
        this.failedForcedTest = false;
        this._forceTestAfterSteps = -1;
        this._forceTestAtSteps = -1;
        this.reset();
    }

    get lastTransition(): number {
        return this._lastTransition;
    }

    set lastTransition(transition: number) {
        this._lastTransition = transition;
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
        if (this._lastTransition == t.getTotalStepsExecuted()) {
            return false;
        }
        if (this.failedForcedTest) {
            return false;
        }

        // times up... force testing of conditions and if they are not fulfilled make add as failed
        if ((this._forceTestAtSteps !== -1 && this._forceTestAtSteps <= t.getTotalStepsExecuted())
            || (this._forceTestAfterSteps !== -1 && this._forceTestAfterSteps <= stepsSinceLastTransition)) {

            let noneFailed = true;
            for (const c of this.conditions) {
                try {
                    const res = c.check(stepsSinceLastTransition, stepsSinceEnd);
                    if (res.passed === false) {
                        noneFailed = false;
                        cu.addTimeLimitFailOutput(this._getTimeLimitFailedOutput(c, t, res.reason));
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
    registerComponents(checkListener: CheckUtility, t: TestDriver): void {
        if (this.forceTestAt != -1) {
            this._forceTestAtSteps = VMWrapper.convertFromTimeToSteps(this.forceTestAt);
        }
        if (this.forceTestAfter != -1) {
            this._forceTestAfterSteps = VMWrapper.convertFromTimeToSteps(this.forceTestAfter) + 1; // +1 so its less flaky
        }
        this.conditions.forEach(cond => {
            cond.registerComponents(t, checkListener, this.graphID);
        });
    }

    reset(): void {
        this._forceTestAtSteps = -1;
        this._forceTestAfterSteps = -1;
        this._lastTransition = AbstractModel.initialStepValue;
    }

    abstract toJSON(): ModelEdgeJSON;

    private _getTimeLimitFailedOutput(condition: Check, t: TestDriver, reason: Reason): string {
        if (this._forceTestAtSteps != -1 && this._forceTestAtSteps <= t.getTotalStepsExecuted()) {
            return getTimeLimitFailedAtOutput(this, condition, this.forceTestAt, reason);
        } else {
            return getTimeLimitFailedAfterOutput(this, condition, this.forceTestAfter, reason);
        }
    }
}
