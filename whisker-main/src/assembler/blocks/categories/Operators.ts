import {Block} from "../Block";
import {mathNumberInput, mathWholeNumberInput, NoShadowInput, ShadowInput, textInput} from "../Inputs";
import {Opcode, OperatorBlockOpcode, operatorBlockOpcodes} from "../Opcode";
import {SensingBlock} from "./Sensing";
import {BlockWithField} from "../other/BlockWithField";
import {blockMeta} from "../BlockFactory";
import uid from "scratch-vm/src/util/uid";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;
type Optional<T> = Partial<T>;

type Input<K extends string> = Record<K, ShadowInput>;

export interface OperatorBlock extends Block {
    opcode: OperatorBlockOpcode;
    shadow: false;
}

type Num1 = Input<"NUM1">;
type Num2 = Input<"NUM2">;

interface BinaryArithmetic extends OperatorBlock {
    inputs: Num1 & Num2;
    fields: None;
}

export interface OperatorAdd extends BinaryArithmetic {
    opcode: "operator_add";
}

export function operatorAdd(num1: number | "" = "", num2: number | "" = ""): BlockMeta {
    const block: OperatorAdd = {
        "opcode": "operator_add",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM1": mathNumberInput(num1),
            "NUM2": mathNumberInput(num2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorSubtract extends BinaryArithmetic {
    opcode: "operator_subtract";
}

export function operatorSubtract(num1: number | "" = "", num2: number | "" = ""): BlockMeta {
    const block: OperatorSubtract = {
        "opcode": "operator_subtract",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM1": mathNumberInput(num1),
            "NUM2": mathNumberInput(num2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorMultiply extends BinaryArithmetic {
    opcode: "operator_multiply";
}

export function operatorMultiply(num1: number | "" = "", num2: number | "" = ""): BlockMeta {
    const block: OperatorMultiply = {
        "opcode": "operator_multiply",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM1": mathNumberInput(num1),
            "NUM2": mathNumberInput(num2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorDivide extends BinaryArithmetic {
    opcode: "operator_divide";
}

export function operatorDivide(num1: number | "" = "", num2: number | "" = ""): BlockMeta {
    const block: OperatorDivide = {
        "opcode": "operator_divide",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM1": mathNumberInput(num1),
            "NUM2": mathNumberInput(num2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorMod extends BinaryArithmetic {
    opcode: "operator_mod";
}

export function operatorMod(num1: number | "" = "", num2: number | "" = ""): BlockMeta {
    const block: OperatorMod = {
        "opcode": "operator_mod",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM1": mathNumberInput(num1),
            "NUM2": mathNumberInput(num2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type From = Input<"FROM">;
type To = Input<"TO">;
type Range = From & To;

export interface OperatorRandom extends OperatorBlock {
    opcode: "operator_random";
    inputs: Range;
    fields: None;
}

export function operatorRandom(from: number | "" = 1, to: number | "" = 10): BlockMeta {
    const block: OperatorRandom = {
        "opcode": "operator_random",
        "next": null,
        "parent": null,
        "inputs": {
            "FROM": mathNumberInput(from),
            "TO": mathNumberInput(to)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Operand1 = Input<"OPERAND1">;
type Operand2 = Input<"OPERAND2">;

interface BinaryRelational extends OperatorBlock {
    inputs: Operand1 & Operand2;
    fields: None;
}

export interface OperatorGt extends BinaryRelational {
    opcode: "operator_gt";
}

export interface OperatorLt extends BinaryRelational {
    opcode: "operator_lt";
}

export interface OperatorEquals extends BinaryRelational {
    opcode: "operator_equals";
}

export function operatorGt(operand1: number | "" = "", operand2: number | "" = 50): BlockMeta {
    const block: OperatorGt = {
        "opcode": "operator_gt",
        "next": null,
        "parent": null,
        "inputs": {
            "OPERAND1": mathNumberInput(operand1),
            "OPERAND2": mathNumberInput(operand2),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export function operatorLt(operand1: number | "" = "", operand2: number | "" = 50): BlockMeta {
    const block: OperatorLt = {
        "opcode": "operator_lt",
        "next": null,
        "parent": null,
        "inputs": {
            "OPERAND1": mathNumberInput(operand1),
            "OPERAND2": mathNumberInput(operand2),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export function operatorEquals(operand1: number | "" = "", operand2: number | "" = 50): BlockMeta {
    const block: OperatorEquals = {
        "opcode": "operator_equals",
        "next": null,
        "parent": null,
        "inputs": {
            "OPERAND1": mathNumberInput(operand1),
            "OPERAND2": mathNumberInput(operand2),
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type LogicOperand1 = Record<"OPERAND1", NoShadowInput>;
type LogicOperand2 = Record<"OPERAND2", NoShadowInput>;
type LogicOperands = LogicOperand1 & LogicOperand2;
type LogicOperand = Record<"OPERAND", NoShadowInput>;

interface BinaryLogic extends OperatorBlock {
    inputs: Optional<LogicOperands>;
    fields: None;
}

export interface OperatorAnd extends BinaryLogic {
    opcode: "operator_and";
}

export function operatorAnd(): BlockMeta {
    const block: OperatorAnd = {
        "opcode": "operator_and",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorOr extends BinaryLogic {
    opcode: "operator_or";
}

export function operatorOr(): BlockMeta {
    const block: OperatorOr = {
        "opcode": "operator_or",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorNot extends OperatorBlock {
    opcode: "operator_not";
    inputs: Optional<LogicOperand>;
    fields: None;
}

export function operatorNot(): BlockMeta {
    const block: OperatorNot = {
        "opcode": "operator_not",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}


type String1 = Input<"STRING1">
type String2 = Input<"STRING2">
type Str = Input<"STRING">
type Letter = Input<"LETTER">

export interface OperatorJoin extends OperatorBlock {
    opcode: "operator_join";
    inputs: String1 & String2;
    fields: None;
}

export function operatorJoin(string1 = "apple", string2 = "banana"): BlockMeta {
    const block: OperatorJoin = {
        "opcode": "operator_join",
        "next": null,
        "parent": null,
        "inputs": {
            "STRING1": textInput(string1),
            "STRING2": textInput(string2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorLetterOf extends OperatorBlock {
    opcode: "operator_letter_of";
    inputs: Letter & Str;
    fields: None;
}

export function operatorLetterOf(letter = 1, string = "apple"): BlockMeta {
    const block: OperatorLetterOf = {
        "opcode": "operator_letter_of",
        "next": null,
        "parent": null,
        "inputs": {
            "LETTER": mathWholeNumberInput(letter),
            "STRING": textInput(string)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorLength extends OperatorBlock {
    opcode: "operator_length";
    inputs: Str;
    fields: None;
}

export function operatorLength(string = "apple"): BlockMeta {
    const block: OperatorLength = {
        "opcode": "operator_length",
        "next": null,
        "parent": null,
        "inputs": {
            "STRING": textInput(string)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface OperatorContains extends OperatorBlock {
    opcode: "operator_contains";
    inputs: String1 & String2;
    fields: None;
}

export function operatorContains(string1 = "apple", string2 = "banana"): BlockMeta {
    const block: OperatorContains = {
        "opcode": "operator_contains",
        "next": null,
        "parent": null,
        "inputs": {
            "STRING1": textInput(string1),
            "STRING2": textInput(string2)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Num = Input<"NUM">;

export interface OperatorRound extends OperatorBlock {
    opcode: "operator_round";
    inputs: Num;
    fields: None;
}

export function operatorRound(num: number | "" = ""): BlockMeta {
    const block: OperatorRound = {
        "opcode": "operator_round",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM": mathNumberInput(num)
        },
        "fields": {},
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export const operators = Object.freeze([
    "abs",
    "floor",
    "ceiling",
    "sqrt",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "ln",
    "log",
    "e ^",
    "10 ^",
] as const);

type OperatorChoice = Record<"OPERATOR", [
    operator: typeof operators[number],
    blockID: null,
]>;

export interface OperatorMathOp extends OperatorBlock, BlockWithField {
    opcode: "operator_mathop";
    inputs: Num;
    fields: OperatorChoice;
    shadow: false;
}

export function operatorMathOp(operator: OperatorChoice["OPERATOR"][0] = "abs", num: number | "" = ""): BlockMeta {
    const block: OperatorMathOp = {
        "opcode": "operator_mathop",
        "next": null,
        "parent": null,
        "inputs": {
            "NUM": mathNumberInput(num)
        },
        "fields": {
            "OPERATOR": [
                operator,
                null
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

/**
 * Tells whether the given block is an operator block.
 * https://en.scratch-wiki.info/wiki/Operators_Blocks
 *
 * @param block the block to check
 */
export function isOperatorBlock(block: Block): block is SensingBlock {
    return (operatorBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}
