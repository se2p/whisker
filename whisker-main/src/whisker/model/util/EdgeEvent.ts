import {ModelEdge, outputEffect, spriteChangeEffect, varChangeEffect, varOutputEffect} from "../components/ModelEdge";
import {Condition, ConditionName} from "../components/Condition";

export class Effect {
    name: EffectName;
    effectFunc: string;

    constructor(name: EffectName, effectFunc: string) {
        this.name = name;
        this.effectFunc = effectFunc;
    }
}

export enum EffectName {
    Output = "Output",
    VarOutput = "VarOutput",
    VarChange = "VarChange",
    SpriteChange = "SpriteChange" // attribute of an sprite changes
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
    // negation
    let isANegation = false;
    if (condString.startsWith("!")) {
        isANegation = true;
        condString = condString.substr(1, condString.length);
    }

    const parts = condString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case ConditionName.Key:
            return new Condition(ConditionName.Key, isANegation, parts[1].toLowerCase());
        case ConditionName.Click:
            return new Condition(ConditionName.Click, isANegation, parts[1], parts[2]);
        case ConditionName.VarTest:
            return new Condition(ConditionName.VarTest, isANegation, parts[1], parts[2], parts[3], parts[4]);
        case ConditionName.SpriteTouching:
            return new Condition(ConditionName.SpriteTouching, isANegation, parts[1], parts[2]);
        case ConditionName.SpriteColor:
            return new Condition(ConditionName.SpriteColor, isANegation, parts[1], parts[2], parts[3], parts[4]);
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
            if (parts.length != 4) {
                throw new Error("Edge effect, Event Variable Change, not enough arguments.");
            }
            return new Effect(EffectName.VarChange,
                varChangeEffect.name + openBrackets + parts[1] + commaPart + parts[2] + commaPart
                + parts[3] + closeBrackets);
        case EffectName.SpriteChange:
            if (parts.length != 4) {
                throw new Error("Edge effect, Event Sprite Change, not enough arguments.");
            }
            return new Effect(EffectName.SpriteChange,
                spriteChangeEffect.name + openBrackets + parts[1] + commaPart + parts[2] + commaPart
                + parts[3] + closeBrackets);
        default:
            throw new Error("Edge effect type not recognized or missing.");
    }
}
