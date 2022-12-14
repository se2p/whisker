import TestDriver from "../../../test/test-driver";
import {Effect} from "./Effect";
import {Condition} from "./Condition";
import {CheckUtility} from "../util/CheckUtility";
import {getTimeLimitFailedAfterOutput, getTimeLimitFailedAtOutput} from "../util/ModelError";
import {InputEffect} from "./InputEffect";
import {Check} from "./Check";

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
    _lastTransition: number = 0;

    readonly forceTestAfter: number;
    readonly forceTestAt: number;
    private forceTestAfterSteps: number;
    private forceTestAtSteps: number;
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

        let failedConditions = [];

        // times up... force testing of conditions and if they are not fulfilled make add as failed
        if ((this.forceTestAtSteps && this.forceTestAtSteps <= t.getTotalStepsExecuted())
            || (this.forceTestAfterSteps && this.forceTestAfterSteps <= stepsSinceLastTransition)) {

            for (let i = 0; i < this.conditions.length; i++) {
                try {
                    if (!this.conditions[i].check(stepsSinceLastTransition, stepsSinceEnd)) {
                        this.failedForcedTest = true;
                        failedConditions.push(this.conditions[i]);
                        cu.addTimeLimitFailOutput(this.getTimeLimitFailedOutput(this.conditions[i], t));
                    }
                } catch (e) {
                    cu.addErrorOutput(this.label, this.graphID, e);
                    failedConditions.push(this.conditions[i]);
                }
            }
            return failedConditions;
        }

        // time limit not reached
        for (let i = 0; i < this.conditions.length; i++) {
            try {
                if (!this.conditions[i].check(stepsSinceLastTransition, stepsSinceEnd)) {
                    failedConditions.push(this.conditions[i]);
                }
            } catch (e) {
                failedConditions.push(this.conditions[i]);
                cu.addErrorOutput(this.label, this.graphID, e);
            }
        }

        return failedConditions;
    }

    /**
     * Do nothing.. Only on subtype ProgramModelEdge.
     */
    checkConditionsOnEvent(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number,
                           eventStrings: string[]): Condition[] {
        return this.conditions;
    }

    set lastTransition(transition: number) {
        this._lastTransition = transition;
    }

    private getTimeLimitFailedOutput(condition: Condition, t: TestDriver) {
        if (this.forceTestAtSteps != -1 && this.forceTestAtSteps <= t.getTotalStepsExecuted()) {
            return getTimeLimitFailedAtOutput(this, condition, this.forceTestAt);
        } else {
            return getTimeLimitFailedAfterOutput(this, condition, this.forceTestAfter);
        }
    }

    /**
     * Returns the id of the target node of this edge.
     */
    getEndNodeId() {
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
    registerComponents(checkListener: CheckUtility, t: TestDriver, caseSensitive: boolean): void {
        if (this.forceTestAt != -1) {
            this.forceTestAtSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAt) + 1;
        }
        if (this.forceTestAfter != -1) {
            this.forceTestAfterSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAfter) + 1;
        }
        this.conditions.forEach(cond => {
            cond.registerComponents(checkListener, t, caseSensitive, this.graphID);
        });
    }

    reset(): void {
        this.failedForcedTest = false;
        this.forceTestAtSteps = undefined;
        this.forceTestAfterSteps = undefined;
        this.lastTransition = 0;
    }

    simplifyForSave() {
        let conditions = [];
        this.conditions.forEach(condition => {
            conditions.push(condition.simplifyForSave());
        });
        return {
            id: this.id,
            label: this.label,
            from: this.from,
            to: this.to,
            forceTestAfter: this.forceTestAfter,
            forceTestAt: this.forceTestAt,
            conditions: conditions
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
    override registerComponents(cu: CheckUtility, testDriver: TestDriver, caseSensitive: boolean): void {
        super.registerComponents(cu, testDriver, caseSensitive);
        this.effects.forEach(effect => {
            effect.registerComponents(testDriver, cu, caseSensitive, this.graphID);
        });
    }

    override simplifyForSave() {
        let effects = [];
        this.effects.forEach(effect => {
            effects.push(effect.simplifyForSave());
        });
        return {
            ...super.simplifyForSave(),
            effects: effects
        };
    }

    /**
     * Check the conditions and effects for checks that are depending on the check listeners and the fired events.
     * Effects are checked for Function:true Checks.
     */
    override checkConditionsOnEvent(t: TestDriver, cu: CheckUtility, stepsSinceLastTransition: number, stepsSinceEnd: number,
                           eventStrings: string[]): Condition[] {
        if (this.failedForcedTest) {
            return this.conditions;
        }
        let check = false;

        // look up if this edge has a condition that was triggered
        for (let j = 0; j < this.conditions.length; j++) {
            const cond = this.conditions[j];
            const eventString = CheckUtility.getEventString(cond.name, cond.negated, ...cond.args);
            if (eventStrings.indexOf(eventString) != -1) {
                check = true;
                break;
            } else if (eventString == "Function:true" || eventString == "Probability:1") {
                check = this.testEffectsOnEvent(eventStrings);
                if (check) {
                    break;
                }
            }
        }

        if (!check) {
            return this.conditions;
        }

        let failed = [];
        for (let j = 0; j < this.conditions.length; j++) {
            let cond = this.conditions[j];
            const eventString = CheckUtility.getEventString(cond.name, cond.negated, ...cond.args);

            if (eventStrings.indexOf(eventString) == -1 && !cond.check(stepsSinceLastTransition, stepsSinceEnd)) {
                failed.push(cond);
                break;
            }
        }
        return failed;
    }


    private testEffectsOnEvent(eventStrings: string[]): boolean {
        for (let i = 0; i < this.effects.length; i++) {
            const eventString = CheckUtility.getEventString(this.effects[i].name, this.effects[i].negated,
                ...this.effects[i].args);
            if (eventStrings.indexOf(eventString) != -1) {
                return true;
            } else if (Check.testForContradictingWithEvents(this.effects[i], eventStrings)) {
                // tests whether a event contradicting an effect (of a true condition edge) is there
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
    inputImmediate(t: TestDriver) {
        this.inputEffects.forEach(inputEffect => {
            inputEffect.inputImmediate(t);
        });
    }

    /**
     *  Register the check listener and test driver on the conditions and input effects.
     */
    override registerComponents(checkListener: CheckUtility, testDriver: TestDriver, caseSensitive: boolean): void {
        super.registerComponents(checkListener, testDriver, caseSensitive);
        this.inputEffects.forEach(effect => {
            effect.registerComponents(testDriver, caseSensitive);
        });
    }

    override simplifyForSave() {
        let inputEffects = [];
        this.inputEffects.forEach(effect => {
            inputEffects.push(effect.simplifyForSave());
        });
        return {
            ...super.simplifyForSave(),
            effects: inputEffects
        };
    }
}
