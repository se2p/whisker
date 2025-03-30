import {SafeParseReturnType, z} from "zod";
import {ArgType} from "../util/schema";

export const StringAttributeNames = Object.freeze(["currentCostumeName", "sayText", "rotationStyle"] as const);
export const NumberAttributeNames = Object.freeze(["x", "y", "size", "direction", "layerOrder", "volume"] as const);
export const EffectNames = Object.freeze(["color", "fisheye", "whirl", "pixelate", "mosaic", "brightness", "ghost"] as const);
export const BooleanAttributeNames = Object.freeze(["visible"] as const);
export const AttributeNames = Object.freeze([...StringAttributeNames, ...NumberAttributeNames, ...BooleanAttributeNames] as const);
export const AttributeAndEffectNames = Object.freeze([...AttributeNames, ...EffectNames] as const);
export const Keys = Object.freeze([
    'space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
] as const);
export const EqOrNeqOPs = Object.freeze(["==", "!="] as const);
export const changeOps = Object.freeze(["+", "-", "==", "+=", "-=", "!="] as const);
export const comparisonOps = Object.freeze(["==", "!=", ">", ">=", "<", "<="] as const);

export type SpriteName = string | [string, ...string[]];
export type VariableName = SpriteName;
export type StringAttribute = typeof StringAttributeNames[number];
export type NumberAttribute = typeof NumberAttributeNames[number];
export type BooleanAttribute = typeof BooleanAttributeNames[number];
export type Effect = typeof EffectNames[number];
export type AttrNames = StringAttribute | NumberAttribute | Effect | BooleanAttribute;
export type EqOrNeq = typeof EqOrNeqOPs[number];
export type ComparisonOp = typeof comparisonOps[number];
export type ChangeOp = typeof changeOps[number];
export type NumberOrChangeOp = number | ChangeOp;

export const NumberAttribute = z.enum(NumberAttributeNames);
export const EffectAttribute = z.enum(EffectNames);
export const StringAttribute = z.enum(StringAttributeNames);
export const BooleanAttribute = z.enum(BooleanAttributeNames);
export const KeyArgument = z.preprocess(
    (key) => ["left", "right", "up", "down"].includes(key as string) ? `${key} arrow` : key,
    z.enum(Keys, {message: "InvalidKey"})
);

export const SpriteName = z.union([
    z.string({message: "NoStringProvided"}).min(1, {message: "StringIsEmpty"}),
    z.string().array().nonempty()
], {message: "InvalidSpriteName"});

export const VariableName = SpriteName;

/**
 * Either a number, or a number-like string, e.g., "3.14", "-5", "+1.234", "0e4", but not the empty string.
 */
export const NumberLike = z.union([
    z.number(),
    z.string().refine((s) => s.trim() !== "", "StringIsEmpty")
], {message: "NeitherNumberNorString"})
    .pipe(z.coerce.number({message: "NoNumber"}))
    .refine((n) => !Number.isNaN(n), {message: "NoNumber"});

/**
 * Either true, false, "true" or "false"
 */
export const BooleanLike = z.preprocess((value) => {
        return value === "true" ? true : value === false ? false : value;
    }, z.union([
        z.string(),
        z.boolean()
    ], {message: "NeitherTrueNorFalse"})
).refine(b => typeof b === "boolean", {message: "NeitherTrueNorFalse"});

export const NonNegativeNumber = z.coerce.number({message: "NoNumber"})
    .nonnegative({message: "NumberMustBeNonNegative"});

export const EqOrNeq = z.preprocess(
    (value) => value === "=" ? "==" : value,
    z.enum(EqOrNeqOPs, {message: "InvalidOpForAttribute"})
);

export const ComparisonOp = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisonOps, {message: "InvalidComparison"})
);

const ChangeOp = z.preprocess(
    (change) => change === "=" ? "==" : change,
    z.enum(changeOps, {message: "InvalidChange"})
);

export const NumberOrChangeOp = z.union([
    NumberLike,
    ChangeOp
], { errorMap: () => ({ message: "NeitherNumberNorChange" }) });

export const ProbabilityArg = z.coerce.number({message: "NoNumber"})
    .transform(value => value > 1 ? value / 100 : value)
    .refine(value => 0 <= value && value <= 1, {message: "ValueIsNoProbability"});

export const RGBNumber = z.coerce.number({message: "NoNumber"})
    .min(0, {message: "OutOfRgbRange"})
    .max(255, {message: "OutOfRgbRange"});

export const NonEmptyString = z.string({message: "NoStringProvided"}).min(1, {message: "StringIsEmpty"});

export type InputErrorCodes =
    | "InvalidAttributeOrEffect"
    | "InvalidChange"
    | "InvalidComparison"
    | "InvalidKey"
    | "InvalidOpForAttribute"
    | "InvalidSpriteName"
    | "InvalidVarName"
    | "NeitherFirstNorLast"
    | "NeitherNumberNorChange"
    | "NeitherNumberNorExpr"
    | "NeitherNumberNorString"
    | "NeitherTrueNorFalse"
    | "NoNonEmptyExprText"
    | "NoNumber"
    | "NoStringProvided"
    | "NumberMustBeNonNegative"
    | "OutOfRgbRange"
    | "StringIsEmpty"
    | "ValueIsNoProbability"
    | "There is a bug"
    ;

export type ParsingSuccess = {
    passed: true,
    data: ArgType[],
};
export type ParsingFailure = {
    passed: false,
    problems: Record<number, InputErrorCodes>,
};

export type ParsingResult = ParsingSuccess | ParsingFailure;

export function parseAttributeError(res: SafeParseReturnType<unknown, unknown>): ParsingResult {
    return parseUnionError(res, {1: "InvalidAttributeOrEffect"});
}

export function parseUnionError(res: SafeParseReturnType<unknown, unknown>, defaultMap: Record<number, InputErrorCodes>): ParsingResult {
    if (res.success !== false) {
        return {passed: true, data: res.data as ArgType[]};
    }

    const issues = res.error.issues;

    if (!(issues.length === 1 && issues[0].code === "invalid_union")) {
        return parseNonUnionError(res); // top level is not a union so the wrong method was called
    }

    const error = issues[0].unionErrors.filter(
        e => e.issues.every(i => i.code !== "invalid_enum_value" || i.path[0] != 1)
    ); // remove options of the union where no correct value of the enum was chosen

    let codes: Record<number, InputErrorCodes> = {};
    if (error.length > 0) {
        error.sort((a, b) => a.issues.length - b.issues.length);
        // take option with the lowest amount of issues and display issues for this option
        error[0].issues.forEach((error) => {
            codes[error.path[0]] = error.message;
        });
    } else {
        codes = defaultMap; // no correct value of enums was chosen -> default value
    }

    return {passed: false, problems: codes};
}

export function parseNonUnionError(res: SafeParseReturnType<unknown, unknown>): ParsingResult {
    if (res.success === false) {
        const codes = {};
        res.error.issues.forEach((error) => {
            codes[error.path[0]] = error.message;
        });
        return {passed: false, problems: codes};
    }
    return {passed: true, data: res.data as ArgType[]};
}
