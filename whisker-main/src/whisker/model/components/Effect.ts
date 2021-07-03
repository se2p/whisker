import TestDriver from "../../../test/test-driver";
import ModelResult from "../../../test-runner/model-result";
import {Check, CheckName} from "./Check";

/**
 * Class representing the check of an edge effect.
 */
export class Effect extends Check {
    private _effect: (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;

    /**
     * Get an effect representation, checks the arguments.
     * @param id  Id for this effect.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(id: string, name: CheckName, negated: boolean, args: any[]) {
        super(id, name, args, negated);
    }

    /**
     * Check the edge effect has happened.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    check(stepsSinceLastTransition, stepsSinceEnd: number): boolean {
        return this._effect(stepsSinceLastTransition, stepsSinceEnd);
    }

    /**
     * Register the check listener and test driver and check the effect for errors.
     */
    registerComponents(t: TestDriver, result: ModelResult, caseSensitive: boolean) {
        try {
            this._effect = this.checkArgsWithTestDriver(t, null, caseSensitive);
        } catch (e) {
            console.error(e + ". This effect will be considered as not fulfilled in test run.");
            this._effect = () => false;
            result.addError(e.message);
        }
    }

    /**
     * Get the effect function that evaluates whether the effect is fulfilled. This function is fixed on (and depends)
     * on the test driver that was given by registerComponents(..) previously.
     */
    get effect(): (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
        return this._effect;
    }

    /**
     * Get a readable output for an failed effect trace.
     */
    toString() {
        let result = (this.negated ? "!" : "") + this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        return result;
    }

    /**
     * Whether this effect contradicts another effect check.
     * @param effect The other effect.
     */
    contradicts(effect: Effect): boolean {
        if (this.name != effect.name) {
            return false;
        }

        switch (this.name) {
            case CheckName.Click:
                // you cant click on two different sprites at the same time
                return this.args[0] != effect.args[0];
            case CheckName.BackgroundChange: // contradict if different costume names
                return this.args[0] != effect.args[0];
            case CheckName.Output:
                // contradict if same sprite name and different output
                return this.args[0] == effect.args[0] && this.args[1] != effect.args[1];
            case CheckName.VarChange:
            case CheckName.AttrChange:
                if (this.args[0] != effect.args[0] || this.args[1] != effect.args[1]) {
                    return false;
                }
                return this.args[2].indexOf(effect.args[2]) == -1 && effect.args[2].indexOf(this.args[2]) == -1;
            case CheckName.VarComp:
            case CheckName.AttrComp:
                if (this.args[0] != effect.args[0] || this.args[1] != effect.args[1]) {
                    return false;
                }
                return Effect.checkComparison(this.args[2], effect.args[2], this.args[3], effect.args[3]);
            case CheckName.NbrOfVisibleClones:
            case CheckName.NbrOfClones:
                if (this.args[0] != effect.args[0]) {
                    return false;
                }
                return Effect.checkComparison(this.args[1], effect.args[1], this.args[2], effect.args[2]);
            default:
                return false;
        }
    }

    private static checkComparison(comparison1: string, comparison2: string, value1: string, value2: string): boolean {
        if (comparison1 == comparison2 && value1 == value2) {
            return false; // same effect checks
        }

        // =
        if ((comparison1 == '=' || comparison2 == '==') && (comparison2 == '=' || comparison2 == '==')) {
            return value1 != value2;
        } else if (comparison1 == '=' || comparison1 == '==') {
            return !eval(value1 + comparison2 + value2);
        } else if (comparison2 == '=' || comparison2 == '==') {
            return !eval(value2 + comparison1 + value1);
        }
        // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
        if (comparison1.startsWith(comparison2) || comparison2.startsWith(comparison1)) {
            return false;
        }

        return !eval(value2 + comparison1 + value1) || !eval(value1 + comparison2 + value2);
    }
}
