import {SafeParseReturnType, z, ZodError} from "zod";
import {ArgType} from "../util/schema";

export const stringAttributeNames = Object.freeze(["currentCostumeName", "sayText", "rotationStyle"] as const);
export const numberAttributeNames = Object.freeze(["x", "y", "size", "direction", "layerOrder", "volume", "currentCostume"] as const);
export const effectNames = Object.freeze(["color", "fisheye", "whirl", "pixelate", "mosaic", "brightness", "ghost"] as const);
export const booleanAttributeNames = Object.freeze(["visible"] as const);
export const attributeNames = Object.freeze([...stringAttributeNames, ...numberAttributeNames, ...booleanAttributeNames] as const);
export const attributeAndEffectNames = Object.freeze([...attributeNames, ...effectNames] as const);
export const keys = Object.freeze([
    'space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
] as const);
export const eqOrNeqOPs = Object.freeze(["==", "!="] as const);
export const changeOps = Object.freeze(["+", "-", "==", "+=", "-=", "!="] as const);
export const comparisonOps = Object.freeze(["==", "!=", ">", ">=", "<", "<="] as const);

export type SpriteName = string | [string, ...string[]];
export type VariableName = SpriteName;
export type StringAttribute = typeof stringAttributeNames[number];
export type NumberAttribute = typeof numberAttributeNames[number];
export type BooleanAttribute = typeof booleanAttributeNames[number];
export type Effect = typeof effectNames[number];
export type AttrName = StringAttribute | NumberAttribute | Effect | BooleanAttribute;
export type EqOrNeq = typeof eqOrNeqOPs[number];
export type ComparisonOp = typeof comparisonOps[number];
export type ChangeOp = typeof changeOps[number];
export type NumberOrChangeOp = number | ChangeOp;

export const NumberAttribute = z.enum(numberAttributeNames);
export const EffectAttribute = z.enum(effectNames);
export const StringAttribute = z.enum(stringAttributeNames);
export const BooleanAttribute = z.enum(booleanAttributeNames);
export const KeyArgument = z.preprocess(
    (key) => ["left", "right", "up", "down"].includes(key as string) ? `${key} arrow` : key,
    z.enum(keys, {message: "InvalidKey"})
);

const name = (name: string) => z.union([
    z.string({message: "NoStringProvided"}).min(1, {message: "StringIsEmpty"}),
    z.string().array().nonempty()
], {message: `Invalid${name}Name`});

export const SpriteName = name("Sprite");
export const VariableName = name("Variable");


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
        return value === "true" ? true : value === "false" ? false : value;
    }, z.union([
        z.string(),
        z.boolean()
    ], {message: "NeitherTrueNorFalse"})
).refine(b => typeof b === "boolean", {message: "NeitherTrueNorFalse"});

export const NonNegativeNumber = z.coerce.number({message: "NoNumber"})
    .nonnegative({message: "NumberMustBeNonNegative"});

export const EqOrNeq = z.preprocess(
    (value) => value === "=" ? "==" : value,
    z.enum(eqOrNeqOPs, {message: "InvalidOpForAttribute"})
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
], {errorMap: () => ({message: "NeitherNumberNorChange"})});

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

export function parseAttributeError(res: SafeParseReturnType<unknown, unknown>, attributeIndex: number): ParsingResult {
    const map = {};
    map[attributeIndex] = "InvalidAttributeOrEffect";
    // if there is no error at the attribute index for some option the issues of this option should be displayed
    const keyExtractor: (e: ZodError) => number = e => e.issues.filter(i => i.path[0] === attributeIndex).length > 0 ? 1 : 0;
    return parseUnionError(res, map, keyExtractor);
}

/**
 * This method parses zod types where the top level type is a union. The assumption is that one argument of a fixed
 * index will always provide multiple options such as ["==","!="] or ["x", "y"] and another argument at the same index
 * may instead provide [">","<"] or ["sayText", "currentCostume"]. The types of the remaining arguments typically depend
 * on this option. If no argument option matches the input at the index then no valid option was provided.
 * In this case the {@linkcode defaultMap} is used because there is no other way to provide feedback on the wrong input.
 * This map should be something of the form {1: "invalidOptionForArgument1}.
 * If at the fixed index a valid option like "==" is used this method assumes the goal was to choose the union option
 * where "==" is valid at the given index. Then this option is used for parsing.
 * @param res The result of some .safeParse(...) call
 * @param defaultMap Error map that is returned if the specific index is not valid for each option of the top level union.
 * @param keyExtractor
 */
export function parseUnionError(res: SafeParseReturnType<unknown, unknown>, defaultMap: Record<number, InputErrorCodes>,
                                keyExtractor: (issue: ZodError) => number): ParsingResult {
    if (res.success !== false) {
        return {passed: true, data: res.data as ArgType[]};
    }

    const issues = res.error.issues;

    if (!(issues.length === 1 && issues[0].code === "invalid_union")) {
        return parseNonUnionError(res); // top level is not a union so the wrong method was called
    }

    const errors = issues[0].unionErrors.filter(
        e => e.issues.every(i => i.code !== "invalid_enum_value" || i.path[0] != 1)
    ); // remove options of the union where no correct value of the enum was chosen

    let codes: Record<number, InputErrorCodes> = {};
    if (errors.length > 0) {
        // take preferred option
        errors.sort((a, b) => keyExtractor(a) - keyExtractor(b));
        errors[0].issues.forEach((error) => {
            codes[error.path[0]] = error.message; //path[0] contains the index issue which was caused by a faulty arg
        });
    } else {
        codes = defaultMap; // no correct value of enums was chosen -> default value
    }

    return {passed: false, problems: codes};
}

/**
 * Parses the result of a safeParse call from zod. If the parsing was a success the parsed result is returned, otherwise
 * the zod error is converted to a map of the form: "index of invalid argument" -> "error code"
 * @param res The result of some .safeParse(...) call
 */
export function parseNonUnionError(res: SafeParseReturnType<unknown, unknown>): ParsingResult {
    if (res.success === false) {
        const codes = {};
        res.error.issues.forEach((error) => {
            codes[error.path[0]] = error.message;  //path[0] contains the index issue which was caused by a faulty arg
        });
        return {passed: false, problems: codes};
    }
    return {passed: true, data: res.data as ArgType[]};
}
