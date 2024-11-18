import {Effect} from "./Effect";
import {CheckUtility} from "../util/CheckUtility";
import TestDriver from "../../../test/test-driver";
import {Condition} from "./Condition";
import {Check, CheckJSON} from "./Check";
import {ModelEdge, ModelEdgeJSON} from "./ModelEdge";

export interface ProgramModelEdgeJSON extends ModelEdgeJSON {
    effects: CheckJSON[];
}

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends ModelEdge {
    private readonly _effects: Effect[] = [];

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
    addEffect(effect: Effect): void {
        this._effects.push(effect);
    }

    get effects(): readonly Effect[] {
        return this._effects;
    }

    /**
     * Register the check listener and test driver on the conditions and effects.
     */
    override registerComponents(cu: CheckUtility, testDriver: TestDriver): void {
        super.registerComponents(cu, testDriver);
        this._effects.forEach(effect => {
            effect.registerComponents(testDriver, cu, this.graphID);
        });
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
        for (const e of this._effects) {
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

    override toJSON(): ProgramModelEdgeJSON {
        return {
            id: this.id,
            label: this.label,
            from: this.from,
            to: this.to,
            forceTestAfter: this.forceTestAfter,
            forceTestAt: this.forceTestAt,
            conditions: this.conditions.map((c) => c.toJSON()),
            effects: this._effects.map(effect => effect.toJSON())
        };
    }
}
