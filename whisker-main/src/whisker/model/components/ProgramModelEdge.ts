import {CheckUtility} from "../util/CheckUtility";
import TestDriver from "../../../test/test-driver";
import {AbstractEdge} from "./AbstractEdge";
import {ProgramModelEdgeJSON} from "../util/schema";
import {Check, PureCheck} from "../checks/newCheck";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";

/**
 * Edge structure for a program model with effects that can be triggered based on its conditions.
 */
export class ProgramModelEdge extends AbstractEdge {
    private readonly _effects: Check[] = [];
    private readonly _pureEffects: PureCheck[] = [];

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

    get effects(): readonly Check[] {
        return this._effects;
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addEffect(effect: Check): void {
        this._effects.push(effect);
        if (effect.isPure) {
            this._pureEffects.push(effect);
        }
    }

    /**
     * Check the conditions and effects for checks that are dependent on the check listeners and the fired events.
     * Effects are checked for Expr:true Checks.
     */
    override checkConditionsOnEvent(stepsSinceLastTransition: number, stepsSinceEnd: number): boolean {
        // We call every() instead of forEach() so we terminate early and undesired checks are not cached.
        const allConditionTrue = this.conditions.every(c => c.check(stepsSinceLastTransition, stepsSinceEnd).passed);
        if (allConditionTrue) {
            this._pureEffects.forEach(e => e.check(stepsSinceLastTransition, stepsSinceEnd)); // cache results
        }
        return allConditionTrue;
    }

    /**
     * Register the check listener and test driver on the conditions and effects.
     */
    override registerComponents(cu: CheckUtility, testDriver: TestDriver, newTarget: RenderedTarget | null = null): void {
        super.registerComponents(cu, testDriver, newTarget);
        this._effects.forEach(effect => {
            effect.registerComponents(testDriver, cu, this.graphID, newTarget);
        });
    }

    override toJSON(): ProgramModelEdgeJSON {
        return {
            id: this.id,
            label: this.label,
            from: this.from,
            to: this.to,
            forceTestAfter: this.forceAfter,
            forceTestAt: this.forceAt,
            conditions: this.conditions.map((c) => c.toJSON()),
            effects: this._effects.map(effect => effect.toJSON())
        };
    }
}
