import TestDriver from "../../../test/test-driver";
import {AbstractEdge} from "./AbstractEdge";
import {UserModelEdgeJSON} from "../util/schema";
import {UserInput} from "../inputs/newUserInput";

/**
 * Edge structure that has input effects triggered if the conditions are fulfilled.
 */
export class UserModelEdge extends AbstractEdge {
    private readonly _userInputs: UserInput[] = [];

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

    get userInputs(): readonly UserInput[] {
        return this._userInputs;
    }

    /**
     * Add an effect to the edge.
     * @param effect Effect function as a string.
     */
    addUserInput(effect: UserInput): void {
        this._userInputs.push(effect);
    }

    /**
     * Start the input effects of this edge.
     */
    async inputImmediate(t: TestDriver): Promise<void> {
        for (const inputEffect of this._userInputs) {
            await inputEffect.inputImmediate(t, this.graphID);
        }
    }

    checkConditionsOnEvent(_stepsSinceLastTransition: number, _stepsSinceEnd: number): boolean {
        return false;
    }

    override toJSON(): UserModelEdgeJSON {
        return {
            id: this.id,
            label: this.label,
            from: this.from,
            to: this.to,
            forceTestAfter: this.forceAfter,
            forceTestAt: this.forceAt,
            conditions: this.conditions.map((c) => c.toJSON()),
            effects: this._userInputs.map(input => input.toJSON())
        };
    }
}
