export abstract class CustomError extends Error {
    protected constructor(override readonly message: string) {
        super(message);
    }

    override get name(): string {
        return this.constructor.name;
    }
}

export class NoSuchKeyError extends CustomError {
    constructor(override readonly message: string) {
        super(message);
    }
}
