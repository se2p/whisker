import {CheckUtility} from "../util/CheckUtility";
import TestDriver from "../../../test/test-driver";
import {AbstractCheck} from "../checks/AbstractCheck";
import {AbstractEdge} from "./AbstractEdge";
import {ProgramModelEdgeJSON} from "../util/schema";
import {Checks} from "../util/Checks";
import {Expr} from "../checks/Expr";
import {Probability} from "../checks/Probability";

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends AbstractEdge {
    private readonly _effects: AbstractCheck[] = [];

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
    addEffect(effect: AbstractCheck): void {
        this._effects.push(effect);
    }

    get effects(): readonly AbstractCheck[] {
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
     * Effects are checked for Expr:true Checks.
     */
    override checkConditionsOnEvent(stepsSinceLastTransition: number, stepsSinceEnd: number, eventStrings: Checks): AbstractCheck[] {
        if (this.failedForcedTest) {
            return this.conditions;
        }
        let check = false;

        // look up if this edge has a condition that was triggered
        for (const c of this.conditions) {
            if (eventStrings.includes(c)) {
                check = true;
                break;
            } else if (c instanceof Expr && c.args[0] === "true" || c instanceof Probability && c.args[0] === 1) {
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
            if (!eventStrings.includes(c) && !c.check(stepsSinceLastTransition, stepsSinceEnd)) {
                failed.push(c);
                break; // TODO check if this break should be here
            }
        }
        return failed;
    }


    private _testEffectsOnEvent(eventStrings: Checks): boolean {
        for (const e of this._effects) {
            if (eventStrings.includes(e)) {
                return true;
            }

            if (e.testForContradictingWithEvents(eventStrings)) {
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
