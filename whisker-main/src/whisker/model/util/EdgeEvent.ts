import {ModelEdge, outputEffect, varChangeEffect, varOutputEffect} from "../components/ModelEdge";
import {Condition} from "../edgeConditions/Condition";
import {KeyCondition} from "../edgeConditions/KeyCondition";
import {ClickCondition} from "../edgeConditions/ClickCondition";
import {VarTestCondition} from "../edgeConditions/VarTestCondition";
import {SpriteTouchingCondition} from "../edgeConditions/SpriteTouchingCondition";
import {SpriteColorCondition} from "../edgeConditions/SpriteColorCondition";

export class Effect {
    name: EffectName;
    effectFunc: string;

    constructor(name: EffectName, effectFunc: string) {
        this.name = name;
        this.effectFunc = effectFunc;
    }
}

export enum ConditionName {
    Key = "Key",
    Click = "Click",
    VarTest = "VarTest",
    SpriteTouching = "SpriteTouching", // two sprites touching each other
    SpriteColor = "SpriteColor", // sprite touching a color
}

export enum EffectName {
    Output = "Output",
    VarOutput = "VarOutput",
    VarChange = "VarChange",
}

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

const openBrackets = "('";
const closeBrackets = "');";
const commaPart = "','";

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(condString): Condition {
    const parts = condString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case ConditionName.Key:
            return new KeyCondition(parts[1].toLowerCase());
        case ConditionName.Click:
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Click, not enough arguments");
            }
            return new ClickCondition(parts[1], parts[2]);
        case ConditionName.VarTest:
            if (parts.length != 4) {
                throw new Error("Edge condition, not enough arguments, variable name, comparison mode, value");
            }

            return new VarTestCondition(parts[1], parts[2], parts[3]);
        case ConditionName.SpriteTouching:
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Sprite Touching, not enough sprite names given.");
            }
            return new SpriteTouchingCondition(parts[1], parts[2]);
        case ConditionName.SpriteColor:
            if (parts.length != 5) {
                throw new Error("Edge condition, Event Sprite touching color, not enough arguments.");
            }
            return new SpriteColorCondition(parts[1], parts[2], parts[3], parts[4]);
        default:
            throw new Error("Edge condition type not recognized or missing.");
    }
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
    const parts = effectString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge effect not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case EffectName.Output:
            return new Effect(EffectName.Output, outputEffect.name + openBrackets + parts[1] + closeBrackets);
        case EffectName.VarOutput:
            if (parts.length != 3) {
                throw new Error("Edge effect, Event Variable Output, not enough arguments.");
            }
            return new Effect(EffectName.VarOutput,
                varOutputEffect.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets);
        case EffectName.VarChange:
            if (parts.length != 3) {
                throw new Error("Edge effect, Event Variable Change, not enough arguments.");
            }
            return new Effect(EffectName.VarChange,
                varChangeEffect.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets);
        default:
            throw new Error("Edge effect type not recognized or missing.");
    }
}
