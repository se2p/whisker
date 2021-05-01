import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";
import {ModelResult} from "../../../test-runner/test-result";

export enum EffectName {
    Output = "Output", // sprite name, string output
    VarChange = "VarChange", // sprite name, var name, ( + | - | new value)
    AttrChange = "AttrChange", // sprite name, attr name, (+|-|new value)
    CostumeChange = "CostumeChange", // attribute of an sprite changes, spriteName: string, costumeNew: string
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
    private readonly effect: (testDriver: TestDriver, modelResult: ModelResult) => boolean;
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
            let error = new Error("Not enough arguments for effect " + name + ".");
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
                this.effect = Effect.checkOutputEffect(negated, args[0], args[1]);
                break;
            case EffectName.VarChange:
                testArgs(3);
                this.effect = Effect.checkVariableEffect(negated, args[0], args[1], args[2])
                break;
            case EffectName.AttrChange:
                testArgs(3);
                this.effect = Effect.checkAttributeEffect(negated, args[0], args[1], args[2])
                break;
            case EffectName.CostumeChange:
                testArgs(2);
                this.effect = Effect.checkCostumeEffect(negated, args[0], args[1]);
                break;
            case EffectName.BackgroundChange:
                testArgs(1);
                this.effect = Effect.checkBackgroundEffect(negated, args[0]);
                break;
            case EffectName.Function:
                testArgs(1);
                this.effect = this.args[0]; // todo eval and negated
                break;
            default:
                throw new Error("Effect type not recognized.");
        }
    }

    /**
     * Check the edge effect has happened.
     * @param testDriver Instance of the test driver.
     * @param modelResult For logging and errors.
     */
    check(testDriver: TestDriver, modelResult: ModelResult): boolean {
        return this.effect(testDriver, modelResult);

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
        // console.log("Testing condition: " + this.name + this.args);
        switch (this.name) {
            case EffectName.Output:
                sprite = this._checkSpriteExistence(testDriver, this.args[0]);
                break;
            case EffectName.VarChange:
                sprite = this._checkSpriteExistence(testDriver, this.args[0]);
                if (!sprite.getVariable(this.args[1])) {
                    throw new Error("Variable " + this.args[1] + " is not defined on sprite " + this.args[0] + ".");
                }
                break;
            case EffectName.AttrChange:
                this._checkAttributeExistence(testDriver, this.args[1]);
                break;
            case EffectName.BackgroundChange:
                // nothing yet...
                break;
            case EffectName.CostumeChange:
                this._checkSpriteExistence(testDriver, this.args[0]);
                break;
            case EffectName.Function:
                try {
                    eval(this.args[0]);
                } catch (e) {
                    throw new Error("Condition Function cannot be evaluated:\n" + e);
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

    /**
     * Check the attribute name.
     * @private
     */
    private _checkAttributeExistence(testDriver: TestDriver, attrName: string) {
        try {
            let sprite = this._checkSpriteExistence(testDriver, this.args[0]);
            eval("sprite." + attrName);
        } catch (e) {
            throw new Error("Attribute " + attrName + " is not defined on sprite " + this.args[0] + ".");
        }
    }

    /**
     * Check the existence of a sprite.
     * @param testDriver Instance of the test driver.
     * @param spriteName Name of the sprite.
     */
    private _checkSpriteExistence(testDriver: TestDriver, spriteName: string) {
        let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
        if (sprite == undefined) {
            throw new Error("Sprite not existing with name: " + this.args[0]);
        }
        return sprite;
    }

    /**
     * Defines a function testing a sprite gives an output.
     * @param spriteName Name of the sprite.
     * @param output Output to say.
     * @param negated Whether this effect is negated.
     */
    private static checkOutputEffect(negated: boolean, spriteName: string, output: string):
        (testDriver: TestDriver, modelResult: ModelResult) => boolean {
        return function (testDriver: TestDriver, modelResult: ModelResult) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];

            // todo test whether think and say make a difference
            // todo eval the output (could also contain variables)
            if (sprite.sayText.indexOf(eval(output)) != -1) {
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Defines a function testing whether a variable has changed.
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param change For integer variable '+' for increase, '-' for decrease. For string variables this has the new
     * value.
     * @param negated Whether this effect is negated.
     */
    private static checkVariableEffect(negated: boolean, spriteName: string, varName: string, change: string):
        (testDriver: TestDriver, modelResult: ModelResult) => boolean {
        return function (testDriver: TestDriver, modelResult: ModelResult) {
            let sprite;
            if (spriteName.toLowerCase() === "Stage") { // can the stage even say something?
                sprite = testDriver.getStage();
            } else {
                sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            }

            const variable = sprite.getVariable(varName);
            let result;
            try {
                console.log("compare " + variable.old.value + " " + change + " is " + variable.value, testDriver.getTotalStepsExecuted());
                result = Effect.testChange(variable.old.value, variable.value, change);
            } catch (e) {
                e.msg = e.msg + spriteName + "." + varName;
                console.error(e.msg);
                if (modelResult.error.indexOf(e) == -1) {
                    modelResult.error.push(e);
                }
            }
            if (result) {
                return !negated;
            }
            return negated;
        }
    }


    /**
     * Defines a function testing whether an attribute of a sprite has changed.
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+' for increase, '-' for decrease. '=' for staying the same.For string
     * variables this has the new value.
     * @param negated Whether this effect is negated.
     */
    private static checkAttributeEffect(negated: boolean, spriteName: string, attrName: string, change: string):
        (testDriver: TestDriver, modelResult: ModelResult) => boolean {
        return function (testDriver: TestDriver, modelResult: ModelResult) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            const newValue = eval('sprite.' + attrName);
            const oldValue = eval('sprite.old.' + attrName);

            if ((attrName === "x" || attrName === "y") && sprite.isTouchingEdge() && newValue === oldValue
                && change != "=") {
                return !negated;
            }

            let result;
            try {
                result = Effect.testChange(oldValue, newValue, change);
            } catch (e) {
                e.msg = e.msg + spriteName + "." + attrName;
                console.error(e.msg);
                if (modelResult.error.indexOf(e) == -1) {
                    modelResult.error.push(e);
                }
            }
            if (result) {
                return !negated;
            }
            return negated;
        }
    }

    private static testChange(oldValue, newValue, change) {
        if (change === "+" || change === "++") {
            if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                throw new Error("Effect failed: not a numerical value in variable ");
            }
            return oldValue < newValue;
        } else if (change === "-" || change === "--") {
            if (!this.testNumber(oldValue) || !this.testNumber(newValue)) {
                throw new Error("Effect failed: not a numerical value in ");
            }
            return oldValue > newValue;
        }

        if (change === "=") {
            return oldValue == newValue;
        } else {
            return newValue == change;
        }
    }

    private static testNumber(value) {
        return ((value != null) && (value !== '') && !isNaN(Number(value.toString())));
    }

    /**
     * Defines a function testing whether a sprite has changed to a new costume.
     * @param spriteName Name of the sprite.
     * @param costumeNew Name of the new costume.
     * @param negated Whether this effect is negated.
     */
    private static checkCostumeEffect(negated: boolean, spriteName: string, costumeNew: string):
        (testDriver: TestDriver, modelResult: ModelResult) => boolean {
        return function (testDriver: TestDriver, modelResult: ModelResult) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            if (sprite.currentCostume() == costumeNew) { // todo test
                return !negated;
            }
            return negated;
        }
    }

    /**
     * Defines a function testing whether the background has changed.
     * @param newBackground Name of the new background.
     * @param negated Whether this effect is negated.
     */
    private static checkBackgroundEffect(negated: boolean, newBackground: string):
        (testDriver: TestDriver, modelResult: ModelResult) => boolean {
        return function (testDriver: TestDriver, modelResult: ModelResult) {
            // todo how to get the background
            let stage = testDriver.getStage();
            // stage.
            return negated;
        }
    }

    // todo functions for clones
    // todo functions for counting effect "wiederhole 10 mal"
    // todo effect plays a sound...
    // todo effect change size
    // todo effect "pralle vom rand ab"
    // todo effect "richtung auf x setzen"
    // todo effect "gehe zu zufallsposition"
    // todo effect "drehe dich um ..."
}
