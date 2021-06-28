import TestDriver from "../../../test/test-driver";
import {CheckUtility} from "../util/CheckUtility";
import {ModelEdge} from "./ModelEdge";
import {Check, CheckName} from "./Check";
import ModelResult from "../../../test-runner/model-result";
import {getTimeLimitFailedError} from "../util/ModelError";
import {ModelTester} from "../ModelTester";

/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 * @param forceTestAfter Force testing this condition after given amount of milliseconds.
 * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
 */
export function setUpCondition(newEdge: ModelEdge, condString: string, forceTestAfter, forceTestAt) {
    const conditions = condString.split(",");

    if (forceTestAfter == undefined) {
        forceTestAfter = -1;
    } else {
        forceTestAfter = Number(forceTestAfter.toString());
    }

    if (forceTestAt == undefined) {
        forceTestAt = -1;
    } else {
        forceTestAt = Number(forceTestAt.toString());
    }

    try {
        conditions.forEach(cond => {
            newEdge.addCondition(getCondition(newEdge, cond.trim(), forceTestAfter, forceTestAt));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition string e.g. 'Key:space' for an edge into a condition object. Tests for negation with
 * '!' at the beginning. Splits the condition string based on ':'.
 * @param edge Edge with the given condition string.
 * @param condString String part on the edge of the xml file that is the condition.
 * @param forceTestAfter Force testing this condition after given amount of milliseconds.
 * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
 */
export function getCondition(edge: ModelEdge, condString, forceTestAfter: number, forceTestAt: number): Condition {
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
        return new Condition(edge, CheckName.Function, negated, forceTestAfter, forceTestAt, [theFunction]);
    }


    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }
    return new Condition(edge, parts[0], negated, forceTestAfter, forceTestAt, parts.splice(1, parts.length));
}

/**
 * Defining an edge condition.
 */
export class Condition extends Check {
    private _condition: () => boolean;
    private readonly forceTestAfter: number;
    private forceTestAfterSteps: number;
    private readonly forceTestAt: number;
    private forceTestAtSteps: number;
    private failedForcedTest: boolean;

    /**
     * Get a condition instance. Checks the number of arguments for a condition type.
     * @param edge Parent edge.
     * @param name Type name of the condition.
     * @param negated Whether the condition is negated.
     * @param forceTestAfter Force testing this condition after given amount of milliseconds.
     * @param forceTestAt Force testing this condition after the test run a given amount of milliseconds.
     * @param args The arguments for the condition to check later on.
     */
    constructor(edge: ModelEdge, name: CheckName, negated: boolean, forceTestAfter: number, forceTestAt: number,
                args: any[]) {
        let newID = edge.id + ".condition" + (edge.conditions.length + 1);
        super(newID, edge, name, args, negated);
        this.forceTestAfter = forceTestAfter;
        if (this.forceTestAfter != -1) {
            this.forceTestAfter = forceTestAfter + ModelTester.TIME_LEEWAY;
        }
        this.forceTestAt = forceTestAt;
        if (this.forceTestAt != -1) {
            this.forceTestAt = forceTestAt + ModelTester.TIME_LEEWAY;
        }
        this.failedForcedTest = false;
    }

    /**
     * Register the check listener and test driver and check the condition for errors.
     */
    registerComponents(cu: CheckUtility, t: TestDriver, result: ModelResult, caseSensitive: boolean) {
        try {
            if (this.forceTestAt != -1) {
                this.forceTestAtSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAt);
            }
            if (this.forceTestAfter != -1) {
                this.forceTestAfterSteps = t.vmWrapper.convertFromTimeToSteps(this.forceTestAfter);
            }
            this._condition = this.checkArgsWithTestDriver(t, cu, caseSensitive, true);
        } catch (e) {
            console.error(e + ". This condition will be considered as not fulfilled in test run.");
            this._condition = () => false;
            result.addError(e.message);
        }
    }

    /**
     * Check the edge condition.
     */
    check(t: TestDriver): boolean {
        if (this.failedForcedTest) {
            return false;
        }
        let timeStamp = this.edge.getModel().stepNbrOfLastTransition;
        if ((this.forceTestAtSteps && this.forceTestAtSteps < t.getTotalStepsExecuted())
            || (this.forceTestAfterSteps && this.forceTestAfterSteps < (t.getTotalStepsExecuted() - timeStamp))) {

            if (!this._condition()) {
                this.failedForcedTest = true;
                throw getTimeLimitFailedError(this);
            } else {
                return true; //todo
            }
        }
        return this._condition();
    }

    /**
     * Get the condition function that evaluates whether the condition holds. This function is fixed on (and depends)
     * on the test driver that was given by registerComponents(..) previously.
     */
    get condition(): () => boolean {
        return this._condition;
    }

    reset() {
        this.failedForcedTest = false;
        this.forceTestAtSteps = undefined;
        this.forceTestAfterSteps = undefined;
    }

    /**
     * Get a compact representation for this condition for edge tracing.
     */
    toString() {
        let result = (this._negated ? "!" : "") + this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        if (this.forceTestAt != -1) {
            result += " at " + this.forceTestAt + "ms";
        }
        if (this.forceTestAfter != -1) {
            result += " after " + this.forceTestAfter + "ms";
        }
        return result;
    }
}
