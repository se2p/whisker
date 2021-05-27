import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";
import {Check, CheckName} from "./Check";

/**
 * Evaluate the effects of the given edge.
 * @param newEdge Edge with the effects.
 * @param effectString String representing the effects.
 */
export function setUpEffect(newEdge: ModelEdge, effectString: string) {
    const effects = effectString.split(",");

    try {
        effects.forEach(effect => {
            newEdge.addEffect(getEffect(newEdge, effect));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single effect for an edge into a function that can be evaluated.
 * @param parentEdge Parent edge.
 * @param effectString String defining the effect, f.e. Output:Hmm
 */
export function getEffect(parentEdge: ModelEdge, effectString): Effect {
    let isANegation = false;
    if (effectString.startsWith("!")) {
        isANegation = true;
        effectString = effectString.substr(1, effectString.length);
    }
    const parts = effectString.split(":");

    if (parts[0] == CheckName.Function) {
        // append all elements again as the function could contain a :
        let theFunction = "";
        for (let i = 1; i < parts.length; i++) {
            theFunction += parts[i];
        }
        return new Effect(parentEdge, CheckName.Function, isANegation, [theFunction]);
    }

    if (parts.length < 2) {
        throw new Error("Edge effect not correctly formatted. ':' missing.");
    }
    return new Effect(parentEdge, parts[0], isANegation, parts.splice(1, parts.length));
}

/**
 * Class representing the check of an edge effect.
 */
export class Effect extends Check {
    private _effect: () => boolean;

    /**
     * Get an effect representation, checks the arguments.
     * @param edge Parent edge.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(edge: ModelEdge, name: CheckName, negated: boolean, args: any[]) {
        let newID = edge.id + ".effect" + (edge.effects.length + 1);
        super(newID, edge, name, args, negated);
    }

    /**
     * Check the edge effect has happened.
     */
    check(): boolean {
        return this._effect();
    }

    /**
     * Register the check listener and test driver and check the effect for errors.
     */
    registerComponents(t: TestDriver, result: ModelResult) {
        try {
            this._effect = this.checkArgsWithTestDriver(t, null);
        } catch (e) {
            console.error(e);
            result.addError(e.message);
        }
    }

    get effect(): () => boolean {
        return this._effect;
    }

    /**
     * Get a readable output for an failed effect trace.
     */
    toString() {
        let result = this.name + "(";

        if (this.args.length == 1) {
            result = result + this.args[0];
        } else {
            result = result + this.args.concat();
        }

        result = result + ")";
        if (this.negated) {
            result = result + " (negated)";
        }
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

                // same sprite and same variable/attribute
                let compOp1 = this.args[2];
                let compValue1 = this.args[3];
                let compOp2 = effect.args[2];
                let compValue2 = effect.args[3];

                if (compOp1 == compOp2 && compValue1 == compValue2) {
                    return false; // same effect checks
                }

                // =
                if ((compOp1 == '=' || compOp2 == '==') && (compOp2 == '=' || compOp2 == '==')) {
                    return compValue1 != compValue2;
                } else if (compOp1 == '=' || compOp1 == '==') {
                    return !eval(compValue1 + compOp2 + compValue2);
                } else if (compOp2 == '=' || compOp2 == '==') {
                    return !eval(compValue2 + compOp1 + compValue1);
                }
                // < and <, > and >, < and <=, <= and <=, >= and >, > and >=
                if (compOp1.startsWith(compOp2) || compOp2.startsWith(compOp1)) {
                    return false;
                }

                return !eval(compValue2 + compOp1 + compValue1) || !eval(compValue1 + compOp2 + compValue2);
            default:
                return false;
        }
    }
}
