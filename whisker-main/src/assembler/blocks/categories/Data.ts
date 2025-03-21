export type Variable = RegularVariable | CloudVariable;

/**
 * The values a variable/list can hold.
 */
export type Value = Scalar | Multiple;
export type Scalar = number | string;
export type Multiple = Scalar[];

/**
 * The state of a variable in a Scratch program is represented as a name-value pair. The first
 * element of the pair is the variable name, the second is the value. Variables can either be
 * "regular" variables or cloud variables.
 */
export type RegularVariable = [
    name: string,
    value: Scalar
];

/**
 * Cloud data is a feature that allows users to store number-containing variables "in the cloud," or on Scratch's
 * servers. Cloud variables have the character "☁" (a cloud icon in the font Scratch uses) in front of them, to
 * distinguish them from regular variables.
 *
 * https://en.scratch-wiki.info/wiki/Cloud_Data
 */
export type CloudVariable = [
    name: string,
    value: Scalar,
    isCloudVariable: true
];

/**
 * The state of a list is represented as a name-value pair. The first element is the name of the
 * list, the second element is an array containing the values of the list.
 */
export type List = [
    name: string,
    value: Multiple
];
