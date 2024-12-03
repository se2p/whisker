import {Check, CheckName} from "./Check";
import {ArgType} from "../util/schema";

/**
 * Defining an edge condition.
 */
export class Condition extends Check {

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
    }

    /**
     * Get the condition function that evaluates whether the condition holds. This function is fixed on (and depends)
     * on the test driver that was given by registerComponents(...) previously.
     */
    get condition(): (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
        return this._check;
    }
}
