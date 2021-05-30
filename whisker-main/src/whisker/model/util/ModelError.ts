
// Model errors
import {ProgramModel} from "../components/ProgramModel";
import {ModelEdge} from "../components/ModelEdge";
import {Effect} from "../components/Effect";

function getEffectFailedOutput(effect: Effect) {
    let edge = effect.edge;
    return "Effect failed! Model=" + edge.getModel().id + ". Edge=" + edge.id + ". Effect="
        + effect.toString();
}

function getErrorOnEdgeOutput(model: ProgramModel, edge:ModelEdge, error: string) {
    return "Error was thrown. Model=" + model.id + ". Edge=" + edge.id + ": " + error;
}

function getConstraintFailedOutput(effect: Effect) {
    return "Constraint failed! " + effect.toString();
}

function getConstraintsFailedError(failedConstraints: string) {
    return new Error("Constraints failed! " + failedConstraints + "\n-> Model stopped for this test after" +
        " constraint checks!");
}




// Variables, sprites, attributes not found and other initialization errors

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

function getNotNumericalValueError(value: string) {
    return new Error("Is not a numerical value to compare:" + value);
}

function getChangeComparisonNotKnownError(value: string) {
    throw new Error("Change Comparison not known: " + value);
}

export {
    getEffectFailedOutput,
    getErrorOnEdgeOutput,
    getConstraintFailedOutput,
    getConstraintsFailedError,
    getVariableNotFoundError,
    getAttributeNotFoundError,
    getSpriteNotFoundError,
    getComparisonNotKnownError,
    getFunctionEvalError,
    getEmptyExpressionError,
    getExpressionEndTagMissingError,
    getExpressionEnterError,
    getRGBRangeError,
    getErrorForVariable,
    getErrorForAttribute,
    getNotNumericalValueError,
    getChangeComparisonNotKnownError
};
