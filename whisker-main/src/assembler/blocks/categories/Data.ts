import {mathIntegerInput, mathNumberInput, ShadowInput, textInput} from "../Inputs";
import {Block} from "../Block";
import {DataBlockOpcode, dataBlockOpcodes, Opcode} from "../Opcode";
import {blockMeta} from "../BlockFactory";
import uid from "scratch-vm/src/util/uid";
import {EmptyObject} from "../../utils/Objects";
import {BlockMeta} from "../../utils/meta";

type None = EmptyObject;

const defaultVariableName = "my variable";
const defaultListName = "my list";
const defaultItem = "thing";
const defaultIndex = 1;

export interface DataBlock extends Block {
    opcode: DataBlockOpcode;
}

/**
 * A reference to a variable or list. Every variable/list has a name and an ID. The name of a
 * variable/list must be unique as well.
 */
export type Reference = [
    name: string,
    id: string
];

type ChosenVariable = Record<"VARIABLE", Reference>
type ChosenList = Record<"LIST", Reference>;
type InputValue = Record<"VALUE", ShadowInput>;

export interface DataSetVariableTo extends DataBlock {
    opcode: "data_setvariableto";
    inputs: InputValue;
    fields: ChosenVariable;
    shadow: false;
}

export function dataSetVariableTo(variableName: string = defaultVariableName, value = "0"): BlockMeta {
    const block: DataSetVariableTo = {
        "opcode": "data_setvariableto",
        "next": null,
        "parent": null,
        "inputs": {
            "VALUE": textInput(value),
        },
        "fields": {
            "VARIABLE": [
                variableName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataChangeVariableBy extends DataBlock {
    opcode: "data_changevariableby";
    inputs: InputValue;
    fields: ChosenVariable;
    shadow: false;
}

export function dataChangeVariableBy(variableName: string = defaultVariableName, value = 1): BlockMeta {
    const block: DataChangeVariableBy = {
        "opcode": "data_changevariableby",
        "next": null,
        "parent": null,
        "inputs": {
            "VALUE": mathNumberInput(value)
        },
        "fields": {
            "VARIABLE": [
                variableName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataShowVariable extends DataBlock {
    opcode: "data_showvariable";
    inputs: None;
    fields: ChosenVariable;
    shadow: false;
}

export function dataShowVariable(variableName: string = defaultVariableName): BlockMeta {
    const block: DataShowVariable = {
        "opcode": "data_showvariable",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "VARIABLE": [
                variableName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataHideVariable extends DataBlock {
    opcode: "data_hidevariable";
    inputs: None;
    fields: ChosenVariable;
    shadow: false;
}

export function dataHideVariable(variableName: string = defaultVariableName): BlockMeta {
    const block: DataHideVariable = {
        "opcode": "data_hidevariable",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "VARIABLE": [
                variableName,
                uid()
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Item = Record<"ITEM", ShadowInput>;

export interface DataAddToList extends DataBlock {
    opcode: "data_addtolist";
    inputs: Item;
    fields: ChosenList;
    shadow: false;
}

export function dataAddToList(item: string = defaultItem, listName: string = defaultListName): BlockMeta {
    const block: DataAddToList = {
        "opcode": "data_addtolist",
        "next": null,
        "parent": null,
        "inputs": {
            "ITEM": textInput(item)
        },
        "fields": {
            "LIST": [
                listName,
                uid()
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

type Index = Record<"INDEX", ShadowInput>;

export interface DataDeleteOfList extends DataBlock {
    opcode: "data_deleteoflist";
    inputs: Index;
    fields: ChosenList;
    shadow: false;
}

export function dataDeleteOfList(index: number = defaultIndex, listName: string = defaultListName): BlockMeta {
    const block: DataDeleteOfList = {
        "opcode": "data_deleteoflist",
        "next": null,
        "parent": null,
        "inputs": {
            "INDEX": mathIntegerInput(index)
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataDeleteAllOfList extends DataBlock {
    opcode: "data_deletealloflist";
    inputs: None;
    fields: ChosenList;
    shadow: false;
}

export function dataDeleteAllOfList(listName: string = defaultListName): BlockMeta {
    const block: DataDeleteAllOfList = {
        "opcode": "data_deletealloflist",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataInsertAtList extends DataBlock {
    opcode: "data_insertatlist";
    inputs: Item & Index;
    fields: ChosenList;
    shadow: false;
}

export function dataInsertAtList(item: string = defaultItem, index: number = defaultIndex, listName: string = defaultListName): BlockMeta {
    const block: DataInsertAtList = {
        "opcode": "data_insertatlist",
        "next": null,
        "parent": null,
        "inputs": {
            "ITEM": textInput(item),
            "INDEX": mathIntegerInput(index)
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataReplaceItemOfList extends DataBlock {
    opcode: "data_replaceitemoflist";
    inputs: Item & Index;
    fields: ChosenList;
    shadow: false;
}

export function dataReplaceItemOfList(index: number = defaultIndex, item: string = defaultItem, listName: string = defaultListName): BlockMeta {
    const block: DataReplaceItemOfList = {
        "opcode": "data_replaceitemoflist",
        "next": null,
        "parent": null,
        "inputs": {
            "INDEX": mathIntegerInput(index),
            "ITEM": textInput(item),
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataItemOfList extends DataBlock {
    opcode: "data_itemoflist";
    inputs: Index;
    fields: ChosenList;
}

export function dataItemOfList(index: number = defaultIndex, listName: string = defaultListName): BlockMeta {
    const block: DataItemOfList = {
        "opcode": "data_itemoflist",
        "next": null,
        "parent": null,
        "inputs": {
            "INDEX": mathIntegerInput(index)
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataItemNumOfList extends DataBlock {
    opcode: "data_itemnumoflist";
    inputs: Item;
    fields: ChosenList;
}

export function dataItemNumOfList(item: string = defaultItem, listName: string = defaultListName): BlockMeta {
    const block: DataItemNumOfList = {
        "opcode": "data_itemnumoflist",
        "next": null,
        "parent": null,
        "inputs": {
            "ITEM": textInput(item)
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataLengthOfList extends DataBlock {
    opcode: "data_lengthoflist";
    inputs: None;
    fields: ChosenList;
}

export function dataLengthOfList(listName: string = defaultListName): BlockMeta {
    const block: DataLengthOfList = {
        "opcode": "data_lengthoflist",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataListContainsItem extends DataBlock {
    opcode: "data_listcontainsitem";
    inputs: Item;
    fields: ChosenList;
}

export function dataListContainsItem(item: string = defaultItem, listName: string = defaultListName): BlockMeta {
    const block: DataListContainsItem = {
        "opcode": "data_listcontainsitem",
        "next": null,
        "parent": null,
        "inputs": {
            "ITEM": textInput(item),
        },
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

interface DataShowHideList extends DataBlock {
    inputs: None;
    fields: ChosenList;
    shadow: false;
}

export interface DataShowList extends DataShowHideList {
    opcode: "data_showlist";
}

export function dataShowList(listName: string = defaultListName): BlockMeta {
    const block: DataShowList = {
        "opcode": "data_showlist",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

export interface DataHideList extends DataShowHideList {
    opcode: "data_hidelist";
}

export function dataHideList(listName: string = defaultListName): BlockMeta {
    const block: DataHideList = {
        "opcode": "data_hidelist",
        "next": null,
        "parent": null,
        "inputs": {},
        "fields": {
            "LIST": [
                listName,
                uid(),
            ]
        },
        "shadow": false,
        "topLevel": true,
    };

    return blockMeta({
        [uid()]: block,
    });
}

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

/**
 * Tells whether the given block is a variable block.
 * https://en.scratch-wiki.info/wiki/Variables_Blocks
 *
 * @param block the block to check
 */
export function isDataBlock(block: Block): block is DataBlock {
    return (dataBlockOpcodes as readonly Opcode[]).includes(block.opcode);
}

export function isCloudVariable(variable: Variable): variable is CloudVariable {
    return variable[2] ?? false;
}
