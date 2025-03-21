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
