import {WhiskerTest} from "./WhiskerTest";
import {List} from "../utils/List";

export class WhiskerTestListWithSummary {
    private readonly _testList: List<WhiskerTest>;
    private readonly _summary: string;

    constructor(testList: List<WhiskerTest>, summary: string){
        // console.log('constructing a WhiskerTestListWithSummary, testList: ', testList);
        // console.log('summary: ', summary);
        this._testList = testList;
        this._summary = summary;
    }

    get testList(): List<WhiskerTest> {
        return this._testList;
    }

    get summary(): string {
        return this._summary;
    }
}
