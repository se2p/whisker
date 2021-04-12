import {
    checkClickEvent,
    checkKeyEvent, checkSpriteColorEvent,
    checkSpriteTouchingEvent,
    checkVarTestEvent,
    ModelEdge,
    outputEffect, varOutputEffect, varChangeEffect
} from "../components/ModelEdge";

/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 */
export function evalConditions(newEdge: ModelEdge, condString: string) {
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
export function getCondition(condString): string {
    console.log("Condition: ", condString)
    const parts = condString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge condition not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case "Key":
            return checkKeyEvent.name + openBrackets + parts[1].toLowerCase() + closeBrackets;
        case "Click":
            return checkClickEvent.name + openBrackets + parts[1].toLowerCase() + closeBrackets;
        case "VarTest":
            if (parts.length != 4) {
                throw new Error("Edge condition, Event Sprite Touching, not enough sprite names given.");
            }

            return checkVarTestEvent.name + openBrackets + parts[1] + commaPart + parts[2] + commaPart + parts[3]
                + closeBrackets;
        case "SpriteTouching":
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Sprite Touching, not enough sprite names given.");
            }
            return checkSpriteTouchingEvent.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets;
        case "SpriteColor":
            if (parts.length != 3) {
                throw new Error("Edge condition, Event Sprite Touching, not enough sprite names given.");
            }
            return checkSpriteColorEvent.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets;
        default:
            throw new Error("Edge condition type not recognized or missing.");
    }
}

/**
 * Evaluate the effects of the given edge.
 * @param newEdge Edge with the effects.
 * @param effectString String representing the effects.
 */
export function evalEffect(newEdge: ModelEdge, effectString: string) {
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
export function getEffect(effectString): string {
    const parts = effectString.split(":");

    if (parts.length < 2) {
        throw new Error("Edge effect not correctly formatted. ':' missing.");
    }

    switch (parts[0]) {
        case "Output":
            return outputEffect.name + openBrackets + parts[1] + closeBrackets;
        case "VarOutput":
            return varOutputEffect.name + openBrackets + parts[1] + commaPart + parts[2] + closeBrackets;
        case "VarChange":
            return varChangeEffect.name + openBrackets + parts[1] + closeBrackets;
        default:
            throw new Error("Edge effect type not recognized or missing.");
    }
}
