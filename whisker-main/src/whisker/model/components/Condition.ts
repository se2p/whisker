import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {ModelEdge} from "./ModelEdge";
import {CheckName, Check} from "./Check";
import {ModelResult} from "../../../test-runner/test-result";

/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 */
export function setUpCondition(newEdge: ModelEdge, condString: string) {
    const conditions = condString.split(",");

    try {
        conditions.forEach(cond => {
            newEdge.addCondition(getCondition(newEdge, cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param edge Edge with the given condition.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(edge: ModelEdge, condString): Condition {
    let negated = false;
    if (condString.startsWith("!")) {
        negated = true;
        condString = condString.substr(1, condString.length);
    }

    const parts = condString.split(":");
    if (parts[0] == CheckName.Function) {
        // append all elements again as the function could contain a :
        let theFunction = "";
        for (let i = 1; i < parts.length; i++) {
            theFunction += parts[i];
        }
        return new Condition(edge, CheckName.Function, negated, [theFunction]);
    }


    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }
    return new Condition(edge, parts[0], negated, parts.splice(1, parts.length));
}

/**
 * Defining an edge condition.
 */
export class Condition extends Check {
    private _condition: () => boolean;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param edge Parent edge.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(edge: ModelEdge, name: CheckName, negated: boolean, args: any[]) {
        let newID = edge.id + ".condition" + (edge.conditions.length + 1);
        super(newID, edge, name, args, negated);
    }

    /**
     * Register the check listener and test driver and check the condition for errors.
     */
    registerComponents(cu: CheckUtility, t: TestDriver, result: ModelResult) {
        try {
            this._condition = this.checkArgsWithTestDriver(t, cu);
        } catch (e) {
            console.error(e);
            result.addError(this, e.message);
        }
    }

    /**
     * Check the edge condition.
     */
    check(): boolean {
        return this._condition();
    }

    get condition(): () => boolean {
        return this._condition;
    }

    /**
     * Get a compact representation for this condition for edge tracing.
     */
    toString() {
        let result = this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        if (this._negated) {
            result = result + " (negated)";
        }
        return result;
    }
}
