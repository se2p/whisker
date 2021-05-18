import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {ModelEdge} from "./ModelEdge";
import {CheckName, Checks} from "../util/Checks";
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
            newEdge.addCondition(getCondition(cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(condString): Condition {
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
        return new Condition(CheckName.Function, negated, [theFunction]);
    }


    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }
    return new Condition(parts[0], negated, parts.splice(1, parts.length));
}

/**
 * Defining an edge condition.
 */
export class Condition {
    private readonly name: CheckName;
    private _condition: (...state) => boolean;
    private readonly args: any[];

    private readonly _negated: boolean;
    private checkListener: CheckUtility;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param args The arguments for the condition to check later on.
     */
    constructor(name: CheckName, negated: boolean, args: any[]) {
        this.name = name;
        this.args = args;
        this._negated = negated;
        Checks.testArgs(this.name, Object.values(args));
    }

    /**
     * Register the check listener and test driver and check the condition for errors.
     */
    registerComponents(cu: CheckUtility, t: TestDriver, result: ModelResult) {
        try {
            this._condition = Checks.checkArgsWithTestDriver(t, this.name, this.negated, cu, this.args);
        } catch (e) {
            console.error(e);
            result.error.push(e);
        }
    }

    /**
     * Check the edge condition.
     */
    check(): boolean {
        return this._condition(this.checkListener);
    }

    /**
     * Get the name of the condition event.
     */
    getConditionName(): CheckName {
        return this.name;
    }

    /**
     * Get the arguments for the condition.
     */
    getArgs() {
        return this.args;
    }

    get condition(): (...state) => boolean {
        return this._condition;
    }

    get negated(): boolean {
        return this._negated;
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
