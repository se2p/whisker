import {WhiskerTest} from "./WhiskerTest";

export class WhiskerTestListWithSummary {
    private readonly _testList: WhiskerTest[];
    private _summary: string;
    private _networkPopulation: string;

    constructor(testList: WhiskerTest[], summary: string){
        // console.log('constructing a WhiskerTestListWithSummary, testList: ', testList);
        // console.log('summary: ', summary);
        this._testList = testList;
        this._summary = summary;
    }

    get testList(): WhiskerTest[] {
        return this._testList;
    }

    get summary(): string {
        return this._summary;
    }

    set summary(value: string) {
        this._summary = value;
    }

    get networkPopulation(): string {
        return this._networkPopulation;
    }

    set networkPopulation(value: string) {
        this._networkPopulation = value;
    }
}
