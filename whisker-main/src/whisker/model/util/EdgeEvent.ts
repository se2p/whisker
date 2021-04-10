import {checkClickEvent, checkKeyEvent, checkVarEvent, ModelEdge, outputEffect} from "../components/ModelEdge";

/**
 * Evaluate the conditions for the given edge.
 * @param newEdge Edge with the given condition.
 * @param condString String representing the conditions.
 */
export function evalCondition(newEdge: ModelEdge, condString: string) {
    const conditions = condString.split(",");

    try {
        conditions.forEach(cond => {
            newEdge.addCondition(getCondition(cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/**
 * Converts a single condition for an edge into a function that can be evaluated. Single condition could be f.e.
 * 'Key:space'.
 * @param condString String part on the edge of the xml file that is the condition.
 */
export function getCondition(condString): string {
    if (condString.startsWith("Key:")) {
        return checkKeyEvent.name + "('" + condString.substr(4, condString.length).toLowerCase() + "');";
    } else if (condString.startsWith("Click:")) {
        return checkClickEvent.name + "('" + condString.substr(5, condString.length).toLowerCase() + "');";
    } else if (condString.startsWith("Var:")) {
        return checkVarEvent.name + "('" + condString.substr(4, condString.length).toLowerCase() + "');";
    }
    throw new Error("Edge condition type not recognized or missing.");
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
    if (effectString.startsWith("Output:")) {
        return outputEffect.name + "('" + effectString.substr(7, effectString.length) + "');";
    }
    throw new Error("Edge effect type not recognized or missing.");
}
