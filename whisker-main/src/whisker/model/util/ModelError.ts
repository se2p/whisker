// Model errors
import {AbstractEdge} from "../components/AbstractEdge";
import {ArgType} from "./schema";
import {Check} from "../checks/newCheck";

export function getReasonAppendix(reason: Record<string, unknown>): string {
    return reason && Object.keys(reason).length > 0 ? `${JSON.stringify(reason)}` : "";
}

export function getTimeLimitFailedAfterOutput(edge: AbstractEdge, condition: Check, ms: number): string {
    return `${edge.graphID}-${edge.label}: ${condition.toString()} after ${ms}ms`;
}

export function getTimeLimitFailedAtOutput(edge: AbstractEdge, condition: Check, ms: number): string {
    return `${edge.graphID}-${edge.label}: ${condition.toString()} at ${ms}ms`;
}

// ----- Variables, sprites, attributes not found and other initialization errors

export class VariableNotFoundError extends Error {
    constructor(variableName: string, spriteName: string) {
        super(`Variable not found: ${spriteName}.${variableName}`);
    }
}

export class AttributeNotFoundError extends Error {
    constructor(spriteName: string, attrName: string) {
        super(`Attribute not found: ${spriteName}.${attrName}`);
    }
}

export class SpriteNotFoundError extends Error {
    constructor(spriteName: string) {
        super(`Sprite not found: ${spriteName}`);
    }
}

export class ExprEvalError extends Error {
    constructor(e: unknown, code: string) {
        super(`Expression cannot be evaluated:
${getErrorMessage(e)}
code: ${code}`);
    }
}

export class ExpressionSyntaxError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class EmptyExpressionError extends Error {
    constructor() {
        super("Sprite/variable expression empty.");
    }
}

export class RGBRangeError extends Error {
    constructor() {
        super("RGB ranges not correct.");
    }
}

export class ErrorForVariable extends Error {
    constructor(spriteName: ArgType, varName: ArgType, error: unknown) {
        super(`${spriteName}.${varName}: ${getErrorMessage(error)}`);
    }
}

export class ErrorForEffect extends Error {
    constructor(spriteName: ArgType, effectName: ArgType, error: unknown) {
        super(`${spriteName}.effect["${effectName}"]: ${getErrorMessage(error)}`);
    }
}

export class NotANumericalValueError extends Error {
    constructor(value: ArgType) {
        super(`Is not a numerical value to compare:${value}`);
    }
}

export class ErrorForAttribute extends Error {
    constructor(spriteName: ArgType, attrName: ArgType, error: unknown) {
        super(`${spriteName}.${attrName}: ${getErrorMessage(error)}`);
    }
}

export function getErrorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}
