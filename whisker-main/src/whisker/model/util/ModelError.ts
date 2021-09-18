// Model errors
import {ModelEdge} from "../components/ModelEdge";
import {Effect} from "../components/Effect";
import {Condition} from "../components/Condition";
import {CheckName} from "../components/Check";

function getEffectFailedOutput(edge: ModelEdge, effect: Effect) {
    let conditions = edge.conditions;
    let containsAfterTime;
    let containsElapsed;

    for (let i = 0; i < conditions.length; i++) {
        if (conditions[i].name == CheckName.TimeBetween || conditions[i].name == CheckName.TimeAfterEnd) {
            containsAfterTime = conditions[i].args[0];
        } else if (conditions[i].name == CheckName.TimeElapsed) {
            containsElapsed = conditions[i].args[0];
        }
    }

    let result = edge.graphID + "-" + edge.label + ": " + effect.toString();
    if (containsElapsed != undefined) {
        result += " before " + containsElapsed + "ms elapsed";
    }
    if (containsAfterTime != undefined) {
        result += " after " + containsAfterTime + "ms";
    }
    return result;
}

function getTimeLimitFailedAfterOutput(edge: ModelEdge, condition: Condition, ms: number) {
    return edge.graphID + "-" + edge.label + ": " + condition.toString() + " after " + ms + "ms";
}

function getTimeLimitFailedAtOutput(edge: ModelEdge, condition: Condition, ms: number) {
    return edge.graphID + "-" + edge.label + ": " + condition.toString() + " at " + ms + "ms";
}

function getErrorOnEdgeOutput(edgeLabel: string, graphLabel: string, error: string) {
    return "Error " + graphLabel + "-" + edgeLabel + ": " + error;
}

// ----- Variables, sprites, attributes not found and other initialization errors

function getVariableNotFoundError(variableName: string, spriteName: string) {
    return new Error("Variable not found: " + spriteName + "." + variableName);
}

function getAttributeNotFoundError(attrName: string, spriteName: string) {
    return new Error("Attribute not found: " + spriteName + "." + attrName);
}

function getSpriteNotFoundError(spriteName: string) {
    return new Error("Sprite not found: " + spriteName);
}

function getComparisonNotKnownError(comparison: string) {
    return new Error("Comparison not known: " + comparison);
}

function getFunctionEvalError(error: Error) {
    return new Error("Function cannot be evaluated:\n" + error.message);
}

function geExprEvalError(error: Error) {
    return new Error("Expression cannot be evaluated:\n" + error.message);
}

function getExpressionEndTagMissingError() {
    return new Error("Sprite/variable expression missing closing tag ')'");
}

function getEmptyExpressionError() {
    return new Error("Sprite/variable expression empty.");
}

function getExpressionEnterError() {
    return new Error("Sprite/variable expression may not contain new line element.");
}

function getRGBRangeError() {
    return new Error("RGB ranges not correct.");
}

function getErrorForVariable(spriteName: string, varName: string, error: string) {
    return new Error(spriteName + "." + varName + ": " + error);
}

function getErrorForAttribute(spriteName: string, attrName: string, error: string) {
    return new Error(spriteName + "." + attrName + ": " + error);
}

function getNotANumericalValueError(value: string) {
    return new Error("Is not a numerical value to compare:" + value);
}

function getChangeComparisonNotKnownError(value: string) {
    throw new Error("Change Comparison not known: " + value);
}

export {
    getEffectFailedOutput,
    getErrorOnEdgeOutput,
    getVariableNotFoundError,
    getAttributeNotFoundError,
    getSpriteNotFoundError,
    geExprEvalError,
    getComparisonNotKnownError,
    getFunctionEvalError,
    getEmptyExpressionError,
    getTimeLimitFailedAfterOutput,
    getTimeLimitFailedAtOutput,
    getExpressionEndTagMissingError,
    getExpressionEnterError,
    getRGBRangeError,
    getErrorForVariable,
    getErrorForAttribute,
    getNotANumericalValueError,
    getChangeComparisonNotKnownError
};
