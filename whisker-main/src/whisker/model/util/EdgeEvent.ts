import {checkClickEvent, checkKeyEvent, checkVarEvent, ModelEdge} from "../components/ModelEdge";

/**
 * Load and set the condition for the edge. todo
 * @param newEdge
 * @param edgeAttr
 */
export function evalCondition(newEdge: ModelEdge, edgeAttr: { [p: string]: string }) {
    const conditions = edgeAttr.condition.split(",");

    try {
        conditions.forEach(cond => {
            newEdge.condition.push(getCondition(cond));
        })
    } catch (e) {
        throw new Error("Edge '" + newEdge.id + "': " + e.message);
    }
}

/* Key pressed (without duration, for the moment)*/
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
