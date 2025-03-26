import {z} from "zod";

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
export const KeyArgument = z.enum(Keys);


export const SpriteName = z.union([
    z.string(),
    z.string().array().nonempty()
]);

export const VariableName = z.string();

/**
 * Either a number, or a number-like string, e.g., "3.14", "-5", "+1.234", "0e4", but not the empty string.
 */
export const NumberLike = z.union([
    z.number(),
    z.string().refine((s) => s.trim() !== "")
])
    .pipe(z.coerce.number())
    .refine((n) => !Number.isNaN(n));
/**
 * Either true, false, "true" or "false"
 */
export const BooleanLike = z.preprocess((value) => {
        return value === "true" ? true : value === false ? false : value;
    }, z.union([
        z.string(),
        z.boolean()
    ])
).refine(b => typeof b === "boolean");

export const NonNegativeNumber = z.coerce.number().nonnegative();
export const EqOrNeq = z.preprocess(
    (value) => value === "=" ? "==" : value,
    z.enum(EqOrNeqOPs)
);

export const ComparisonOp = z.preprocess(
    (v) => v === "=" ? "==" : v, // Canonicalize "=" to "=="
    z.enum(comparisonOps)
);
const ChangeOp = z.preprocess(
    (change) => change === "=" ? "==" : change,
    z.enum(changeOps)
);
export const NumberOrChangeOp = NumberLike.or(ChangeOp);

export const ProbabilityArg = z.coerce.number()
    .transform(value => value > 1 ? value / 100 : value)
    .refine(value => 0 <= value && value <= 1);

export const RGBNumber = z.coerce.number().min(0).max(255);
