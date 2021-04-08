/* Key pressed (without duration, for the moment)
 */

export function checkKeyEvent() {

}

export function checkClickEvent() {

}

export function checkVar() {

}

/**
 * Converts the string on an model edge from a xml file to a string condition that can be evaluated later on and
 * checks the Scratch vm for the current input.
 * @param condString String on the edge of the xml file that is the condition.
 */
export function getCondition(condString): string {
    if (condString.startsWith("Key:")) {
        return "checkKeyEvent('" + condString.substr(4,condString.length).toLowerCase() + "');";
    } else if (condString.startsWith("Click:")) {
        return "checkClickEvent('"+ condString.substr(5, condString.length).toLowerCase() + "');";
    } else if (condString.startsWith("Var:")) {
        return "checkVar('"+ condString.substr(4, condString.length).toLowerCase() + "');";
    }
    throw new Error("Edge condition type not recognized or missing.");
}
