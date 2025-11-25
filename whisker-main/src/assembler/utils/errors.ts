import {BlockID} from "../blocks/Block";

export abstract class CustomError extends Error {
    protected constructor(override readonly message: string) {
        super(message);
    }

    override get name(): string {
        return this.constructor.name;
    }
}

export class NoSuchBlockError extends CustomError {
    constructor(private readonly _blockID: BlockID) {
        super(`Block "${_blockID}" does not exist`);
    }

    get blockID(): BlockID {
        return this._blockID;
    }
}

export class InvalidBlockError extends CustomError {
    constructor(override readonly message: string) {
        super(message);
    }
}

export class ValidationError extends CustomError {
    constructor(override readonly message: string) {
        super(message);
    }
}

export class NoSuchKeyError extends CustomError {
    constructor(override readonly message: string) {
        super(message);
    }
}
