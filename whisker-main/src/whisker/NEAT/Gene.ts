/**
 * A Gene which saves the innovation number of NodeGenes and ConnectionGenes
 */

export class Gene {

    private _innovationNumber: number;

    constructor(innovationNumber: number) {
        this._innovationNumber = innovationNumber;
    }


    getInnovationNumber(): number {
        return this._innovationNumber;
    }

    setInnovationNumber(innovationNumber: number): void {
        this._innovationNumber = innovationNumber;
    }
}
