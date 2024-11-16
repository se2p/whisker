import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import {CheckUtility} from "../util/CheckUtility";
import {getTimeLimitFailedAfterOutput, getTimeLimitFailedAtOutput} from "../util/ModelError";
import {InputEffect, SimpleInputEffect} from "./InputEffect";
import {Check, SimpleCheck} from "./Check";
import {NodeID} from "./ModelNode";

export type EdgeID = string;

export interface SimpleModelEdge {
    id: EdgeID;
    label: string;
    from: NodeID;
    to: NodeID;
    forceTestAt: number;
    forceTestAfter: number
    conditions: SimpleCheck[];
}

export interface SimpleProgramModelEdge extends SimpleModelEdge {
    effects: SimpleCheck[];
}

export interface SimpleUserModelEdge extends SimpleModelEdge {
    effects: SimpleInputEffect[];
}

/**
 * Super type for the edges. All edge types have their id, the conditions and start and end node in common (defined
 * here).
 */
export abstract class ModelEdge {
    readonly id: string;
    readonly label: string;
    readonly graphID: string;

    /* Id of the source node */
    readonly from: string;
    /* Id of the target node*/
    readonly to: string;
    conditions: Condition[] = [];
    _lastTransition = 0;

    readonly forceTestAfter: number;
    readonly forceTestAt: number;
    private _forceTestAfterSteps: number;
    private _forceTestAtSteps: number;
    protected failedForcedTest: boolean;

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
    }

    /**
     * Test whether the conditions on this edge are fulfilled.
     * @param t Instance of the test driver
     * @param cu Check listener instance for error and fail outputs.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     * @Returns the failed conditions.
     */
    checkConditions(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number): Condition[] {
        if (this._lastTransition == t.getTotalStepsExecuted() + 1) {
            return this.conditions;
        }
        if (this.failedForcedTest) {
            return this.conditions;
        }

        const failedConditions: Condition[] = [];

        // times up... force testing of conditions and if they are not fulfilled make add as failed
        if ((this._forceTestAtSteps !== -1 && this._forceTestAtSteps <= t.getTotalStepsExecuted())
            || (this._forceTestAfterSteps !== -1 && this._forceTestAfterSteps <= stepsSinceLastTransition)) {

            for (const c of this.conditions) {
                try {
                    if (!c.check(stepsSinceLastTransition, stepsSinceEnd)) {
                        this.failedForcedTest = true;
                        failedConditions.push(c);
                        cu.addTimeLimitFailOutput(this._getTimeLimitFailedOutput(c, t));
                    }
                } catch (e) {
                    cu.addErrorOutput(this.label, this.graphID, e);
                    failedConditions.push(c);
                }
            }
            return failedConditions;
        }

        // time limit not reached
        for (const c of this.conditions) {
            try {
                if (!c.check(stepsSinceLastTransition, stepsSinceEnd)) {
                    failedConditions.push(c);
                }
            } catch (e) {
                failedConditions.push(c);
                cu.addErrorOutput(this.label, this.graphID, e);
            }
        }

        return failedConditions;
    }

    abstract checkConditionsOnEvent(stepsSinceLastTransition: number, stepsSinceEnd: number, eventStrings: string[]): Condition[];

    set lastTransition(transition: number) {
        this._lastTransition = transition;
    }

    get lastTransition(): number {
        return this._lastTransition;
    }

    private _getTimeLimitFailedOutput(condition: Condition, t: TestDriver): string {
        if (this._forceTestAtSteps != -1 && this._forceTestAtSteps <= t.getTotalStepsExecuted()) {
            return getTimeLimitFailedAtOutput(this, condition, this.forceTestAt);
        } else {
            return getTimeLimitFailedAfterOutput(this, condition, this.forceTestAfter);
        }
    }

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
            this._forceTestAtSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAt) + 1;
        }
        if (this.forceTestAfter != -1) {
            this._forceTestAfterSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAfter) + 1;
        }
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, t, this.graphID);
        });
    }

    reset(): void {
        this.failedForcedTest = false;
        this._forceTestAtSteps = -1;
        this._forceTestAfterSteps = -1;
        this.lastTransition = 0;
    }

    toJSON(): SimpleModelEdge {
        return {
            id: this.id,
            label: this.label,
            from: this.from,
            to: this.to,
            forceTestAfter: this.forceTestAfter,
            forceTestAt: this.forceTestAt,
            conditions: this.conditions.map((condition: Condition) => condition.toJSON())
        };
    }
}

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends ModelEdge {
    effects: Effect[] = [];
    failedEffects: Effect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param label Label of the edge.
     * @param graphID Id of the parent graph.
     * @param from Index of the source node.
     * @param to Index of the target node.
     * @param forceTestAfter Force testing this condition after given amount of milliseconds.
     * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
     */
    constructor(id: string, label: string, graphID: string, from: string, to: string, forceTestAfter: number,
                forceTestAt: number) {
        super(id, label, graphID, from, to, forceTestAfter, forceTestAt);
    }

    override reset(): void {
        super.reset();
        this.failedEffects = [];
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    /**
     * Register the check listener and test driver on the conditions and effects.
     */
    override registerComponents(cu: CheckUtility, testDriver: TestDriver): void {
        super.registerComponents(cu, testDriver);
        this.effects.forEach(effect => {
            effect.registerComponents(testDriver, cu, this.graphID);
        });
    }

    override toJSON(): SimpleProgramModelEdge {
        return {
            ...super.toJSON(),
            effects: this.effects.map(effect => effect.toJSON())
        };
    }

    /**
     * Check the conditions and effects for checks that are dependent on the check listeners and the fired events.
     * Effects are checked for Function:true Checks.
     */
    override checkConditionsOnEvent(stepsSinceLastTransition: number, stepsSinceEnd: number, eventStrings: string[]): Condition[] {
        if (this.failedForcedTest) {
            return this.conditions;
        }
        let check = false;

        // look up if this edge has a condition that was triggered
        for (const c of this.conditions) {
            const eventString = CheckUtility.getEventString(c.name, c.negated, ...c.args);
            if (eventStrings.includes(eventString)) {
                check = true;
                break;
            } else if (eventString == "Function:true" || eventString == "Probability:1") {
                check = this._testEffectsOnEvent(eventStrings);
                if (check) {
                    break;
                }
            }
        }

        if (!check) {
            return this.conditions;
        }

        const failed = [];
        for (const c of this.conditions) {
            const eventString = CheckUtility.getEventString(c.name, c.negated, ...c.args);
            if (!eventStrings.includes(eventString) && !c.check(stepsSinceLastTransition, stepsSinceEnd)) {
                failed.push(c);
                break; // TODO check if this break should be here
            }
        }
        return failed;
    }


    private _testEffectsOnEvent(eventStrings: string[]): boolean {
        for (const e of this.effects) {
            const eventString = CheckUtility.getEventString(e.name, e.negated, ...e.args);

            if (eventStrings.includes(eventString)) {
                return true;
            }

            if (Check.testForContradictingWithEvents(e, eventStrings)) {
                // tests whether an event contradicting an effect (of a true condition edge) is there
                return true;
            }
        }

        return false;
    }
}

/**
 * Edge structure that has input effects triggered if the conditions are fulfilled.
 */
export class UserModelEdge extends ModelEdge {
    inputEffects: InputEffect[] = [];

    /**
     * Create a new edge.
     * @param id ID of the edge.
     * @param label Label of the edge.
     * @param graphID Id of the parent graph.
     * @param from Index of the source node.
     * @param to Index of the target node.
     * @param forceTestAfter Force testing this condition after given amount of milliseconds.
     * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
     */
    constructor(id: string, label: string, graphID: string, from: string, to: string, forceTestAfter: number,
                forceTestAt: number) {
        super(id, label, graphID, from, to, forceTestAfter, forceTestAt);
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addInputEffect(effect: InputEffect): void {
        this.inputEffects.push(effect);
    }

    /**
     * Start the input effects of this edge.
     */
    inputImmediate(t: TestDriver): void {
        this.inputEffects.forEach(inputEffect => {
            inputEffect.inputImmediate(t);
        });
    }

    /**
     *  Register the check listener and test driver on the conditions and input effects.
     */
    override registerComponents(checkListener: CheckUtility, testDriver: TestDriver): void {
        super.registerComponents(checkListener, testDriver);
        this.inputEffects.forEach(effect => {
            effect.registerComponents(testDriver);
        });
    }

    checkConditionsOnEvent(_stepsSinceLastTransition: number, _stepsSinceEnd: number, _eventStrings: string[]): Condition[] {
        return this.conditions;
    }

    override toJSON(): SimpleUserModelEdge {
        return {
            ...super.toJSON(),
            effects: this.inputEffects.map(value => value.toJSON())
        };
    }
}
