import TestDriver from "../../../test/test-driver";
import {ModelEdge} from "./ModelEdge";

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
    // negation
    let isANegation = false;
    if (effectString.startsWith("!")) {
        isANegation = true;
        effectString = effectString.substr(1, effectString.length);
    }
    const parts = effectString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge effect not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case EffectName.Output:
            return new Effect(EffectName.Output, isANegation, parts[1], parts[2]);
        case EffectName.VarChange:
            return new Effect(EffectName.VarChange, isANegation, parts[1], parts[2], parts[3]);
        case EffectName.CostumeChange:
            return new Effect(EffectName.CostumeChange, isANegation, parts[1], parts[2]);
        case EffectName.BackgroundChange:
            return new Effect(EffectName.BackgroundChange, isANegation, parts[1]);
        case EffectName.Function:
            return new Effect(EffectName.Function, isANegation, parts[1]);
        case EffectName.AttrChange:
            return new Effect(EffectName.AttrChange, isANegation, parts[1], parts[2], parts[3]);
        default:
            throw new Error("Edge effect type not recognized or missing.");
    }
}

/**
 * Class representing the check of an edge effect.
 */
export class Effect {
    private readonly name: EffectName;
    private readonly args = [];
    private readonly effect: (testDriver: TestDriver) => boolean;
    private readonly negated: boolean;

    /**
     * Get an effect representation, checks the arugments.
     * @param name Name of the effect type.
     * @param negated Whether the effect is negated (e.g. it does not output "hello")
     * @param args Arguments for the effect e.g. sprite names.
     */
    constructor(name: EffectName, negated: boolean, ...args) {
        this.name = name;
        this.args = args;
        this.negated = negated;

        let argsError = function () {
            return "Not enough arguments for effect " + name + ".";
        }

        // todo refactor
        // Get the effect function
        switch (this.name) {
            case EffectName.Output:
                if (this.args.length != 2 || args[0] == undefined || args[1] == undefined)
                    throw new Error(argsError());
                this.effect = this._checkOutputEffect(args[0], args[1]);
                break;
            case EffectName.VarChange:
                if (this.args.length != 3 || args[0] == undefined || args[1] == undefined || args[2] == undefined)
                    throw new Error(argsError());
                this.effect = this._checkVarChangeEffect(args[0], args[1], args[2])
                break;
            case EffectName.AttrChange:
                if (this.args.length != 3 || args[0] == undefined || args[1] == undefined || args[2] == undefined)
                    throw new Error(argsError());
                this.effect = this._checkAttrChangeEffect(args[0], args[1], args[2])
                break;
            case EffectName.CostumeChange:
                if (this.args.length != 2 || args[0] == undefined || args[1] == undefined)
                    throw new Error(argsError());
                this.effect = this._checkCostumeChange(args[0], args[1]);
                break;
            case EffectName.BackgroundChange:
                if (this.args.length != 1 || args[0] == undefined)
                    throw new Error(argsError());
                this.effect = this._checkBackgroundChange(args[0]);
                break;
            case EffectName.Function:
                if (this.args.length != 1 || args[0] == undefined) throw new Error(argsError());
                this.effect = this.args[0]; // todo
                break;
            default:
                throw new Error("Effect type not recognized.");
        }
    }

    /**
     * Check the edge effect has happened.
     * @param testDriver Instance of the test driver.
     */
    check(testDriver: TestDriver): boolean {
        return this.effect(testDriver);

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
     */
    private _checkOutputEffect(spriteName: string, output: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite;
            if (spriteName.toLowerCase() === "Stage") { // can the stage even say something?
                sprite = testDriver.getStage();
            } else {
                sprite = testDriver.getSprite(spriteName);
            }

            // todo test whether think and say make a difference
            // todo eval the output (could also contain variables)
            return sprite.sayText === eval(output);
        }
    }

    /**
     * Defines a function testing whether a variable has changed.
     * @param spriteName Name of the sprite having the variable.
     * @param varName Name of the variable.
     * @param change For integer variable '+' for increase, '-' for decrease. For string variables this has the new
     * value.
     */
    private _checkVarChangeEffect(spriteName: string, varName: string, change: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite;
            if (spriteName.toLowerCase() === "Stage") { // can the stage even say something?
                sprite = testDriver.getStage();
            } else {
                sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            }

            const variable = sprite.getVariable(varName);
            console.log(variable); // todo somethings going wrong here, bug: Punkte = -3 here
            if (change == "+") {
                // check for an increase of integer value of the variable
                // todo check if its an integer variable
                return variable.value > variable.old.value;
            } else if (change == "-") {
                // check for an decrease of integer value of the variable
                // todo check if its an integer variable
                return variable.value < variable.old.value;
            } else {
                // check whether the new value equals change now
                return variable.value === change;
            }
        }
    }


    /**
     * Defines a function testing whether an attribute of a sprite has changed.
     * @param spriteName Name of the sprite having the variable.
     * @param attrName Name of the attribute.
     * @param change For integer variable '+' for increase, '-' for decrease. For string variables this has the new
     * value.
     */
    private _checkAttrChangeEffect(spriteName: string, attrName: string, change: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite;
            if (spriteName.toLowerCase() === "Stage") { // can the stage even say something?
                sprite = testDriver.getStage();
            } else {
                sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            }
            const value = eval('sprite.' + attrName);
            const oldValue = eval('sprite.old.' + attrName);

            let result: boolean;
            if (change == "+") {
                // check for an increase of integer value of the variable
                // todo check if its an integer variable
                result = value > oldValue;
            } else if (change == "-") {
                // check for an decrease of integer value of the variable
                // todo check if its an integer variable
                result = value < oldValue;
            } else {
                // check whether the new value equals change now
                result = value == change;
            }
            return result;
        }
    }

    /**
     * Defines a function testing whether a sprite has changed to a new costume.
     * @param spriteName Name of the sprite.
     * @param costumeNew Name of the new costume.
     */
    private _checkCostumeChange(spriteName: string, costumeNew: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            let sprite = testDriver.getSprites(sprite => sprite.name.includes(spriteName), false)[0];
            return sprite.currentCostume() == costumeNew; // todo test
        }
    }

    /**
     * Defines a function testing whether the background has changed.
     * @param newBackground Name of the new background.
     */
    private _checkBackgroundChange(newBackground: string): (testDriver: TestDriver) => boolean {
        return function (testDriver: TestDriver) {
            // todo how to get the background
            let stage = testDriver.getStage();
            // stage.
            return false;
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
