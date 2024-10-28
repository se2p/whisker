// Model errors
import {ModelEdge} from "../components/ModelEdge";
import {Effect} from "../components/Effect";
import {Condition} from "../components/Condition";
import {ArgType, CheckName} from "../components/Check";

function getEffectFailedOutput(edge: ModelEdge, effect: Effect): string {
    const conditions = edge.conditions;
    let containsAfterTime: string;
    let containsElapsed: string;

    for (const c of conditions) {
        if (c.name == CheckName.TimeBetween || c.name == CheckName.TimeAfterEnd) {
            containsAfterTime = c.args[0].toString();
        } else if (c.name == CheckName.TimeElapsed) {
            containsElapsed = c.args[0].toString();
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
    constructor(e: unknown) {
        super("Function cannot be evaluated:\n" + getErrorMessage(e));
    }
}

export class ExprEvalError extends Error {
    constructor(e: unknown) {
        super("Expression cannot be evaluated:\n" + getErrorMessage(e));
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
    constructor(spriteName: ArgType, varName: ArgType, error: unknown) {
        super(spriteName + "." + varName + ": " + getErrorMessage(error));
    }
}

export class NotANumericalValueError extends Error {
    constructor(value: ArgType) {
        super("Is not a numerical value to compare:" + value);
    }
}

export class ErrorForAttribute extends Error {
    constructor(spriteName: ArgType, attrName: ArgType, error: unknown) {
        super(spriteName + "." + attrName + ": " + getErrorMessage(error));
    }
}

class ChangeComparisonNotKnownError extends Error {
    constructor(value: string) {
        super("Change Comparison not known: " + value);
    }
}

function getErrorMessage(e: unknown): string {
    return e instanceof Error? e.message : String(e);
}

export {
    getEffectFailedOutput,
    getErrorOnEdgeOutput,
    getTimeLimitFailedAfterOutput,
    getTimeLimitFailedAtOutput,
    ChangeComparisonNotKnownError,
    getErrorMessage,
};
