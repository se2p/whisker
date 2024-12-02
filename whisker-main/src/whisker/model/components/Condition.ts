import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {Check, CheckName} from "./Check";
import {ArgType} from "../util/schema";

/**
 * Defining an edge condition.
 */
export class Condition extends Check {
    private _condition: (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param id Id of the condition
     * @param edgeLabel Label of the parent edge of the check.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(id: string, edgeLabel: string, name: CheckName, negated: boolean, args: ArgType[]) {
        super(id, edgeLabel, name, args, negated);
        this._condition = () => false;
    }

    /**
     * Register the check listener and test driver and check the condition for errors.
     */
    registerComponents(cu: CheckUtility, t: TestDriver, graphID: string): void {
        try {
            this._condition = this.checkArgsWithTestDriver(t, cu, graphID);
        } catch (e) {
            cu.addErrorOutput(this._edgeLabel, graphID, e);
            this._condition = () => false;
        }
    }

    /**
     * Check the edge condition.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    check(stepsSinceLastTransition: number, stepsSinceEnd: number): boolean {
        return this._condition(stepsSinceLastTransition, stepsSinceEnd);
    }

    /**
     * Get the condition function that evaluates whether the condition holds. This function is fixed on (and depends)
     * on the test driver that was given by registerComponents(...) previously.
     */
    get condition(): (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
        return this._condition;
    }
}
