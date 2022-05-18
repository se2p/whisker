export type Innovation  = AddConnectionInnovation | AddNodeSplitConnectionInnovation;

export interface AddConnectionInnovation {
    type: 'addConnection';
    idSourceNode: number;
    idTargetNode: number;
    innovationNumber: number;
    recurrent: boolean
}

export interface AddNodeSplitConnectionInnovation {
    type: 'addNodeSplitConnection';
    idSourceNode: number;
    idTargetNode: number;
    firstInnovationNumber: number;
    secondInnovationNumber: number
    idNewNode: number
    splitInnovation: number
}

export type InnovationType =
    | 'addConnection'
    | 'addNodeSplitConnection'
    ;
