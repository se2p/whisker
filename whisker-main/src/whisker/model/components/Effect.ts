import TestDriver from "../../../test/test-driver";
import {Check, CheckName} from "./Check";
import {CheckUtility} from "../util/CheckUtility";

/**
 * Class representing the check of an edge effect.
 */
export class Effect extends Check {
    private _effect: (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;
    dependsOnSayText: boolean;

    /**
     * Get an effect representation, checks the arguments.
     * @param id  Id for this effect.
     * @param edgeLabel Label of the parent edge of the check.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(id: string, edgeLabel: string, name: CheckName, negated: boolean, args: any[]) {
        super(id, edgeLabel, name, args, negated);
        if (name == CheckName.Output || ((name == CheckName.AttrComp || name == CheckName.AttrChange) && (args[1] == "sayText"))) {
            this.dependsOnSayText = true;
        } else if (name == CheckName.Function || name == CheckName.Expr) {
            this.dependsOnSayText = args[0].indexOf(".sayText") != -1;
        } else {
            this.dependsOnSayText = false;
        }
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
    registerComponents(t: TestDriver, cu: CheckUtility, caseSensitive: boolean, graphID: string) {
        try {
            this._effect = this.checkArgsWithTestDriver(t, cu, caseSensitive, graphID);
        } catch (e) {
            this._effect = () => false;
            cu.addErrorOutput(this._edgeLabel, graphID, e);
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
    override toString(): string {
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
        return Check.testForContradicting(this, effect);
    }

}
