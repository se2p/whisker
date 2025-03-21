export type Inputs = {};

export type ConnectedVariableBlock = [
    shadowType: 12,
    variableName: string,
    variableID: string
];

export type TopLevelVariableBlock = [
    ...variable: ConnectedVariableBlock,
    x: number,
    y: number,
];

export type ConnectedListBlock = [
    shadowType: 13,
    listName: string,
    listID: string
];

export type TopLevelListBlock = [
    ...list: ConnectedListBlock,
    x: number,
    y: number
];

export type InputKey = typeof inputKeys[number];

export const inputKeys = Object.freeze([
    "SUBSTACK",
    "SUBSTACK2",
    "CONDITION",
    "TIMES",
    "DURATION",
    "VALUE",
    "CHANGE",
    "NUM",
    "MESSAGE",
    "SECS",
    "SIZE",
    "STEP",
    "DEGREES",
    "FROM",
    "DIRECTION",
    "X",
    "Y",
    "DX",
    "DY",
    "NUM1",
    "NUM2",
    "OPERAND1",
    "OPERAND2",
    "OPERAND",
    "STRING1",
    "STRING2",
    "STRING",
    "LETTER",
    "COLOR",
    "COLOR2",
    "QUESTION",
    "VOLUME",
    "ITEM",
    "INDEX",
    "STEPS",
    "BROADCAST_INPUT",
    "custom_block",
    // Can refer to a shadow block, or a primitive input:
    "TO",
    // These keys always refer to shadow blocks:
    "TOWARDS",
    "COSTUME",
    "BACKDROP",
    "SOUND_MENU",
    "CLONE_OPTION",
    "TOUCHINGOBJECTMENU",
    "DISTANCETOMENU",
    "KEY_OPTION",
    "OBJECT",
    "COLOR_PARAM",
] as const);
