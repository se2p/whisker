import {WhiskerTest} from "./WhiskerTest";

export class WhiskerTestListWithSummary {
    private readonly _testList: WhiskerTest[];
    private _summary: string;

    constructor(testList: WhiskerTest[], summary: string){
        // logger.debug('constructing a WhiskerTestListWithSummary, testList: ', testList);
        // logger.debug('summary: ', summary);
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
}
