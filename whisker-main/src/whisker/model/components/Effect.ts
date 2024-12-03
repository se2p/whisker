import TestDriver from "../../../test/test-driver";
import {Check, CheckName} from "./Check";
import {CheckUtility} from "../util/CheckUtility";
import {ArgType} from "../util/schema";

/**
 * Class representing the check of an edge effect.
 */
export class Effect extends Check {
    private _effect: (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean;
    private readonly _dependsOnSayText: boolean;

    /**
     * Get an effect representation, checks the arguments.
     * @param id  Id for this effect.
     * @param edgeLabel Label of the parent edge of the check.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(id: string, edgeLabel: string, name: CheckName, negated: boolean, args: ArgType[]) {
        super(id, edgeLabel, name, args, negated);

        this._effect = () => false;

        if (name == "Output" || ((name == "AttrComp" || name == "AttrChange") && (args[1] == "sayText"))) {
            this._dependsOnSayText = true;
        } else if (name == "Function" || name == "Expr") {
            this._dependsOnSayText = String(args[0]).includes(".sayText");
        } else {
            this._dependsOnSayText = false;
        }
    }

    /**
     * Check the edge effect has happened.
     * @param stepsSinceLastTransition Number of steps since the last transition in the model this effect belongs to
     * @param stepsSinceEnd Number of steps since the after run model tests started.
     */
    check(stepsSinceLastTransition: number, stepsSinceEnd: number): boolean {
        return this._effect(stepsSinceLastTransition, stepsSinceEnd);
    }

    /**
     * Register the check listener and test driver and check the effect for errors.
     */
    registerComponents(t: TestDriver, cu: CheckUtility, graphID: string): void {
        try {
            this._effect = this.checkArgsWithTestDriver(t, cu, graphID);
        } catch (e) {
            this._effect = () => false;
            cu.addErrorOutput(this._edgeLabel, graphID, e);
        }
    }

    /**
     * Get the effect function that evaluates whether the effect is fulfilled. This function is fixed on (and depends)
     * on the test driver that was given by registerComponents(...) previously.
     */
    get effect(): (stepsSinceLastTransition: number, stepsSinceEnd: number) => boolean {
        return this._effect;
    }

    get dependsOnSayText(): boolean {
        return this._dependsOnSayText;
    }

    /**
     * Whether this effect contradicts another effect check.
     * @param effect The other effect.
     */
    contradicts(effect: Effect): boolean {
        return Check.testForContradicting(this, effect);
    }
}
