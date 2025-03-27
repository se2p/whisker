import {SafeParseReturnType, z, ZodIssue} from "zod";
import {ArgType} from "../util/schema";

export const StringAttributeNames = ["currentCostumeName", "sayText", "rotationStyle"] as const;
export const NumberAttributeNames = ["x", "y", "size", "direction", "layerOrder", "volume"] as const;
export const EffectNames = ["color", "fisheye", "whirl", "pixelate", "mosaic", "brightness", "ghost"] as const;
export const BooleanAttributeNames = ["visible"] as const;
export const AttributeNames = [...StringAttributeNames, ...NumberAttributeNames, ...BooleanAttributeNames] as const;
export const AttributeAndEffectNames = [...AttributeNames, ...EffectNames] as const;
export const Keys = [
    'space', 'left arrow', 'up arrow', 'right arrow', 'down arrow', 'enter',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
] as const;
export const EqOrNeqOPs = ["==", "!="] as const;
export const changeOps = ["+", "-", "==", "+=", "-=", "!="] as const;
export const comparisonOps = Object.freeze(["==", "!=", ">", ">=", "<", "<="] as const);

export type SpriteName = string | [string, ...string[]];
export type VariableName = string;
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

export const VariableName = z.string({message: "NoStringProvided"}).min(1, {message: "StringIsEmpty"});

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

