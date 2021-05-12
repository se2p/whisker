import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";
import {ProgramModel} from "./ProgramModel";
import {Checks} from "../util/Checks";

export enum EffectName {
    Output = "Output", // sprite name, string output
    VarChange = "VarChange", // sprite name, var name, ( + | - | new value)
    AttrChange = "AttrChange", // sprite name, attr name, (+|-|new value)
    VarComp = "VarComp",// this.args: sprite name, variable name, comparison (=,>,<...), value to compare to
    AttrComp = "AttrComp",// this.args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    BackgroundChange = "BackgroundChange",
    Function = "Function"
}

/**
 * Evaluate the effects of the given edge.
 * @param newEdge Edge with the effects.
 * @param effectString String representing the effects.
 */
export function setUpEffect(newEdge: ModelEdge, effectString: string) {
    const effects = effectString.split(",");

    try {
        effects.forEach(effect => {
            newEdge.addEffect(getEffect(effect));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single effect for an edge into a function that can be evaluated.
 * @param effectString String defining the effect, f.e. Output:Hmm
 */
export function getEffect(effectString): Effect {
    let isANegation = false;
    if (effectString.startsWith("!")) {
        isANegation = true;
        effectString = effectString.substr(1, effectString.length);
    }
    const parts = effectString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge effect not correctly formatted. ':' missing.");
    }
    return new Effect(parts[0], isANegation, parts.splice(1, parts.length));
}

/**
 * Class representing the check of an edge effect.
 */
export class Effect {
    private readonly name: EffectName;
    private readonly args = [];
    private _effect : (...state) => boolean;
    private readonly negated: boolean;

    /**
     * Get an effect representation, checks the arguments.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(name: EffectName, negated: boolean, args: any[]) {
        this.name = name;
        this.args = args;
        this.negated = negated;

        let testArgs = function (length) {
            let error = new Error("Wrong number of arguments for effect " + name + ".");
            if (args.length != length) {
                throw error;
            }

            for (let i = 0; i < length; i++) {
                if (args[i] == undefined) {
                    throw error;
                }
            }
        }

        // Get the effect function
        switch (this.name) {
            case EffectName.Output:
                testArgs(2);
                break;
            case EffectName.VarChange:
            case EffectName.AttrChange:
                testArgs(3);
                break;
            case EffectName.BackgroundChange:
            case EffectName.Function:
                testArgs(1);
                break;
            case EffectName.AttrComp:
            case EffectName.VarComp:
                testArgs(4);
                break;
            default:
                throw new Error("Effect type not recognized: " + this.name);
        }
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
    registerComponents(t: TestDriver, result:ModelResult) {
        try {
            switch (this.name) {
                case EffectName.AttrComp:
                    this._effect = Checks.getAttributeComparisonCheck(t, this.negated, this.args[0], this.args[1],
                        this.args[2], this.args[3]);
                    break;
                case EffectName.AttrChange:
                    this._effect = Checks.getAttributeChangeCheck(t, this.negated, this.args[0], this.args[1], this.args[2]);
                    break;
                case EffectName.BackgroundChange:
                    this._effect = Checks.getBackgroundChangeCheck(t, this.negated, this.args[0]);
                    break;
                case EffectName.Function:
                    this._effect = Checks.getFunctionCheck(t, this.negated, this.args[0]);
                    break;
                case EffectName.Output:
                    this._effect = Checks.getOutputOnSpriteCheck(t, this.negated, this.args[0], this.args[1]);
                    break;
                case EffectName.VarChange:
                    this._effect = Checks.getVariableChangeCheck(t, this.negated, this.args[0], this.args[1], this.args[2]);
                    break;
                case EffectName.VarComp:
                    this._effect = Checks.getVariableComparisonCheck(t, this.negated, this.args[0], this.args[1],
                        this.args[2], this.args[3]);
                    break;
            }
        } catch (e) {
            console.error(e);
            result.error.push(e);
        }
    }

    get effect(): (...state) => boolean {
        return this._effect;
    }

    /**
     * Get the name of the effect type.
     */
    getEffectName(): EffectName {
        return this.name;
    }

    /**
     * Whether the effect is negated e.g. 'it does not output hello'.
     */
    isANegation(): boolean {
        return this.negated;
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
}
