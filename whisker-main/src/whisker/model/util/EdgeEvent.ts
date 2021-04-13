import {
    checkClickEvent,
    checkKeyEvent,
    checkSpriteColorEvent,
    checkSpriteTouchingEvent,
    checkVarTestEvent,
    ModelEdge,
    outputEffect,
    varChangeEffect,
    varOutputEffect
} from "../components/ModelEdge";

export class Condition {
    name: ConditionName;
    condFunc: string;

    constructor(name: ConditionName, condFunc: string) {
        this.name = name;
        this.condFunc = condFunc;
    }
}

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
            return new Condition(ConditionName.Key,
                checkKeyEvent.name + openBrackets + parts[1].toLowerCase() + closeBrackets);
        case ConditionName.Click:
            return new Condition(ConditionName.Click,
                checkClickEvent.name + openBrackets + parts[1].toLowerCase() + closeBrackets);
        case ConditionName.VarTest:
            if (parts.length != 4) {
                throw new Error("Edge condition, not enough arguments, variable name, comparison mode, value");
            }

            return new Condition(ConditionName.VarTest,
                checkVarTestEvent.name + openBrackets + parts[1] + commaPart + parts[2] + commaPart + parts[3]
                + closeBrackets);
        case ConditionName.SpriteTouching:
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Sprite Touching, not enough sprite names given.");
            }
            return new Condition(ConditionName.SpriteTouching,
                checkSpriteTouchingEvent.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets);
        case ConditionName.SpriteColor:
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Sprite touching color, not enough arguments.");
            }
            return new Condition(ConditionName.SpriteColor,
                checkSpriteColorEvent.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets);
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
            return new Effect(EffectName.VarOutput,
                varOutputEffect.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets);
        case EffectName.VarChange:
            return new Effect(EffectName.VarChange, varChangeEffect.name + openBrackets + parts[1] + closeBrackets);
        default:
            throw new Error("Edge effect type not recognized or missing.");
    }
}
