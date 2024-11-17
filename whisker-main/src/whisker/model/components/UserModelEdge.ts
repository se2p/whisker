import {InputEffect, InputEffectJSON} from "./InputEffect";
import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {Condition} from "./Condition";
import {ModelEdge, ModelEdgeJSON} from "./ModelEdge";

export interface UserModelEdgeJSON extends ModelEdgeJSON {
    effects: InputEffectJSON[];
}

/**
 * Edge structure that has input effects triggered if the conditions are fulfilled.
 */
export class UserModelEdge extends ModelEdge {
    private readonly _inputEffects: InputEffect[] = [];

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

    get inputEffects(): readonly InputEffect[] {
        return this._inputEffects;
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addInputEffect(effect: InputEffect): void {
        this._inputEffects.push(effect);
    }

    /**
     * Start the input effects of this edge.
     */
    inputImmediate(t: TestDriver): void {
        this._inputEffects.forEach(inputEffect => {
            inputEffect.inputImmediate(t);
        });
    }

    /**
     *  Register the check listener and test driver on the conditions and input effects.
     */
    override registerComponents(checkListener: CheckUtility, testDriver: TestDriver): void {
        super.registerComponents(checkListener, testDriver);
        this._inputEffects.forEach(effect => {
            effect.registerComponents(testDriver);
        });
    }

    checkConditionsOnEvent(_stepsSinceLastTransition: number, _stepsSinceEnd: number, _eventStrings: string[]): Condition[] {
        return this.conditions;
    }

    override toJSON(): UserModelEdgeJSON {
        return {
            ...super.toJSON(),
            effects: this._inputEffects.map(value => value.toJSON())
        };
    }
}
