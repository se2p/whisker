// Model errors
import {ModelEdge} from "../components/ModelEdge";
import {Effect} from "../components/Effect";
import {Condition} from "../components/Condition";
import {ArgType, CheckName} from "../components/Check";

function getEffectFailedOutput(edge: ModelEdge, effect: Effect): string {
    const conditions = edge.conditions;
    let containsAfterTime: string;
    let containsElapsed: string;

    for (let i = 0; i < conditions.length; i++) {
        if (conditions[i].name == CheckName.TimeBetween || conditions[i].name == CheckName.TimeAfterEnd) {
            containsAfterTime = conditions[i].args[0].toString();
        } else if (conditions[i].name == CheckName.TimeElapsed) {
            containsElapsed = conditions[i].args[0].toString();
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

function getTimeLimitFailedAfterOutput(edge: ModelEdge, condition: Condition, ms: number): string {
    return edge.graphID + "-" + edge.label + ": " + condition.toString() + " after " + ms + "ms";
}

function getTimeLimitFailedAtOutput(edge: ModelEdge, condition: Condition, ms: number): string {
    return edge.graphID + "-" + edge.label + ": " + condition.toString() + " at " + ms + "ms";
}

function getErrorOnEdgeOutput(edgeLabel: string, graphLabel: string, error: string): string {
    return "Error " + graphLabel + "-" + edgeLabel + ": " + error;
}

// ----- Variables, sprites, attributes not found and other initialization errors

function getVariableNotFoundError(variableName: string, spriteName: string): Error {
    return new VariableNotFoundError(variableName, spriteName);
}

function getAttributeNotFoundError(attrName: string, spriteName: string): AttributeNotFoundError {
    return new AttributeNotFoundError(attrName, spriteName);
}

function getSpriteNotFoundError(spriteName: string): SpriteNotFoundError {
    return new SpriteNotFoundError(spriteName);
}

function getComparisonNotKnownError(comparison: string): ComparisonNotKnownError {
    return new ComparisonNotKnownError(comparison);
}

function getFunctionEvalError(error: Error): FunctionEvalError {
    return new FunctionEvalError(error);
}

function geExprEvalError(error: Error): ExprEvalError {
    return new ExprEvalError(error);
}

function getExpressionEndTagMissingError(): ExpressionEndTagMissingError {
    return new ExpressionEndTagMissingError();
}

function getEmptyExpressionError(): EmptyExpressionError {
    return new EmptyExpressionError();
}

function getExpressionEnterError(): ExpressionEnterError {
    return new ExpressionEnterError();
}

function getRGBRangeError(): RGBRangeError {
    return new RGBRangeError();
}

function getErrorForVariable(spriteName: string, varName: string, error: string): ErrorForVariable {
    return new ErrorForVariable(spriteName, varName, error);
}

function getErrorForAttribute(spriteName: string, attrName: string, error: string): ErrorForAttribute {
    return new ErrorForAttribute(spriteName, attrName, error);
}

function getNotANumericalValueError(value: string): NotANumericalValueError {
    return new NotANumericalValueError(value);
}

function getChangeComparisonNotKnownError(value: string): ChangeComparisonNotKnownError {
    throw new ChangeComparisonNotKnownError(value);
}

export class VariableNotFoundError extends Error {
    constructor(variableName: string, spriteName: string) {
        super("Variable not found: " + spriteName + "." + variableName);
    }
}

export class AttributeNotFoundError extends Error {
    constructor(attrName: string, spriteName: string) {
        super("Attribute not found: " + spriteName + "." + attrName);
    }
}

export class SpriteNotFoundError extends Error {
    constructor(spriteName: string) {
        super("Sprite not found: " + spriteName);
    }
}

export class ComparisonNotKnownError extends Error {
    constructor(comparison: ArgType) {
        super("Comparison not known: " + comparison);
    }
}

export class FunctionEvalError extends Error {
    constructor(error: Error) {
        super("Function cannot be evaluated:\n" + error.message);
    }
}

export class ExprEvalError extends Error {
    constructor(error: Error) {
        super("Expression cannot be evaluated:\n" + error.message);
    }
}

export class ExpressionEndTagMissingError extends Error {
    constructor() {
        super("Sprite/variable expression missing closing tag ')'");
    }
}

export class EmptyExpressionError extends Error {
    constructor() {
        super("Sprite/variable expression empty.");
    }
}

export class ExpressionEnterError extends Error {
    constructor() {
        super("Sprite/variable expression may not contain new line element.");
    }
}

export class RGBRangeError extends Error {
    constructor() {
        super("RGB ranges not correct.");
    }
}

export class ErrorForVariable extends Error {
    constructor(spriteName: ArgType, varName: ArgType, error: string) {
        super(spriteName + "." + varName + ": " + error);
    }
}

export class NotANumericalValueError extends Error {
    constructor(value: string) {
        super("Is not a numerical value to compare:" + value);
    }
}

export class ErrorForAttribute extends Error {
    constructor(spriteName: ArgType, attrName: ArgType, error: string) {
        super(spriteName + "." + attrName + ": " + error);
    }
}

export class ChangeComparisonNotKnownError extends Error {
    constructor(value: string) {
        super("Change Comparison not known: " + value);
    }
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
