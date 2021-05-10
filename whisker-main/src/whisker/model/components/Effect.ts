import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";
import {ProgramModel} from "./ProgramModel";
import {Util} from "../util/Util";
import {Checks} from "../util/Checks";

export enum EffectName {
    Output = "Output", // sprite name, string output
    VarChange = "VarChange", // sprite name, var name, ( + | - | new value)
    AttrChange = "AttrChange", // sprite name, attr name, (+|-|new value)
    VarTest = "VarTest",// args: sprite name, variable name, comparison (=,>,<...), value to compare to
    AttrTest = "AttrTest",// args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    BackgroundChange = "BackgroundChange",
    Function = "Function",
    Wait = "Wait" // wait in one the model, seconds
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
    private readonly _effect: (testDriver: TestDriver, ...state) => boolean;
    private readonly negated: boolean;

    /**
     * Get an effect representation, checks the arugments.
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
                this._effect = Checks.getOutputOnSpriteCheck(negated, args[0], args[1]);
                break;
            case EffectName.VarChange:
                testArgs(3);
                this._effect = Checks.getVariableChangeCheck(negated, args[0], args[1], args[2])
                break;
            case EffectName.AttrChange:
                testArgs(3);
                this._effect = Checks.getAttributeChangeCheck(negated, args[0], args[1], args[2])
                break;
            case EffectName.BackgroundChange:
                testArgs(1);
                this._effect = Checks.getBackgroundChangeCheck(negated, args[0]);
                break;
            case EffectName.Function:
                testArgs(1);
                this._effect = (t, cs) => {
                    return eval(this.args[0]);
                };
                break;
            case EffectName.Wait:
                testArgs(1);
                this._effect = Checks.getWaitStarter(args[0]);
                break;
            case EffectName.AttrTest:
                testArgs(4);
                this._effect = Checks.getAttributeComparisonCheck(negated, args[0], args[1], args[2], args[3]);
                break;
            case EffectName.VarTest:
                testArgs(4);
                this._effect = Checks.getVariableComparisonCheck(negated, args[0], args[1], args[2], args[3]);
                break;
            default:
                throw new Error("Effect type not recognized.");
        }
    }

    /**
     * Check the edge effect has happened.
     * @param testDriver Instance of the test driver.
     * @param model The model this effect belongs to.
     */
    check(testDriver, model: ProgramModel): boolean {
        return this._effect(testDriver, model);
    }

    get effect(): (testDriver, modelResult: ModelResult, model: ProgramModel) => boolean {
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
     * Check existences of sprites, existences of variables and ranges of arguments.
     * @param testDriver Instance of the test driver.
     */
    testEffectsForErrors(testDriver: TestDriver) {
        let sprite = null;
        switch (this.name) {
            case EffectName.Output:
                sprite = Util.checkSpriteExistence(testDriver, this.args[0]);
                break;
            case EffectName.VarChange:
                sprite = Util.checkSpriteExistence(testDriver, this.args[0]);
                if (!sprite.getVariable(this.args[1])) {
                    throw new Error("Variable " + this.args[1] + " is not defined on sprite " + this.args[0] + ".");
                }
                break;
            case EffectName.AttrChange:
                Util.checkAttributeExistence(testDriver, this.args[0], this.args[1]);
                break;
            case EffectName.VarTest:
                sprite = Util.checkSpriteExistence(testDriver, this.args[0]);
                let variable = sprite.getVariable(this.args[1]);

                if (variable == undefined) {
                    throw new Error("Variable not found: " + this.args[1]);
                }
                if (this.args[2] != "==" && this.args[2] != "=" && this.args[2] != ">" && this.args[2] != ">="
                    && this.args[2] != "<" && this.args[2] != "<=") {
                    throw new Error("Comparison not known: " + this.args[2]);
                }
                break;
            case EffectName.AttrTest:
                Util.checkAttributeExistence(testDriver, this.args[0], this.args[1]);
                if (this.args[2] != "==" && this.args[2] != "=" && this.args[2] != ">" && this.args[2] != ">="
                    && this.args[2] != "<" && this.args[2] != "<=") {
                    throw new Error("Comparison not known: " + this.args[2]);
                }
                break;
            case EffectName.Function:
                try {
                    eval(this.args[0]);
                } catch (e) {
                    throw new Error("Effect Function cannot be evaluated:\n" + e);
                }
                break;
            case EffectName.Wait:
                if (!Util.testNumber(this.args[0]) && this.args[0] > 0) {
                    throw new Error("Effect Wait seconds argument not a number.");
                }
        }
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
