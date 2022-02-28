export class Innovation {

    /**
     * Type of mutation this innovation stems from.
     */
    private readonly _type: InnovationType;

    /**
     * Source node of the innovation.
     */
    private readonly _idSourceNode: number;

    /**
     * Target node of the innovation.
     */
    private readonly _idTargetNode: number;

    /**
     * The innovation number that will be assigned to this innovation.
     */
    private readonly _firstInnovationNumber: number;

    /**
     * If this innovation stems from a node mutation, we have two links and hence two innovation numbers.
     */
    private _secondInnovationNumber: number;

    /**
     * If this innovation stems from a node mutation, this variable holds the innovation number which got split.
     */
    private _splitInnovation: number;

    /**
     * ID of the newly generated node in case of a node mutation.
     */
    private _idNewNode: number;

    /**
     * Recurrent flag of a newly created node, in case of an add link  mutation.
     */
    private _recurrent: boolean;

    /**
     * Holds the highest innovation number.
     */
    public static _currentHighestInnovationNumber = 0;

    private constructor(type: InnovationType, idSourceNode: number, idTargetNode: number, firstInnovationNumber: number) {
        this._type = type;
        this._idSourceNode = idSourceNode;
        this._idTargetNode = idTargetNode;
        this._firstInnovationNumber = firstInnovationNumber;
    }

    public static createInnovation(properties: InnovationProperties): Innovation {
        const innovation = new Innovation(properties.type, properties.idSourceNode, properties.idTargetNode,
            properties.firstInnovationNumber);

        if (properties.firstInnovationNumber > Innovation._currentHighestInnovationNumber) {
            Innovation._currentHighestInnovationNumber = properties.firstInnovationNumber;
        }

        if (properties.secondInnovationNumber !== undefined) {
            innovation._secondInnovationNumber = properties.secondInnovationNumber;
            if (properties.secondInnovationNumber > Innovation._currentHighestInnovationNumber) {
                Innovation._currentHighestInnovationNumber = properties.secondInnovationNumber;
            }
        }

        if (properties.splitInnovation !== undefined) {
            innovation._splitInnovation = properties.splitInnovation;
        }

        if (properties.idNewNode !== undefined) {
            innovation._idNewNode = properties.idNewNode;
        }

        if (properties.recurrent !== undefined) {
            innovation._recurrent = properties.recurrent;
        }

        return innovation;
    }

    get type(): InnovationType {
        return this._type;
    }

    get idSourceNode(): number {
        return this._idSourceNode;
    }

    get idTargetNode(): number {
        return this._idTargetNode;
    }

    get firstInnovationNumber(): number {
        return this._firstInnovationNumber;
    }

    get secondInnovationNumber(): number {
        return this._secondInnovationNumber;
    }

    get splitInnovation(): number {
        return this._splitInnovation;
    }

    get idNewNode(): number {
        return this._idNewNode;
    }

    get recurrent(): boolean {
        return this._recurrent;
    }
}


export type InnovationType =
    | "newNode"
    | "newConnection"
    ;

export interface InnovationProperties {
    type: InnovationType;
    idSourceNode: number;
    idTargetNode: number;
    firstInnovationNumber: number;
    secondInnovationNumber?: number;
    splitInnovation?: number
    idNewNode?: number;
    recurrent?: boolean;
}
