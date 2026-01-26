import {TfAgentWrapper} from "../agents/TfAgentWrapper";

export class RLTestSuite {

    constructor(private readonly _testCases: TfAgentWrapper[]) {
    }

    get testCases(): TfAgentWrapper[] {
        return this._testCases;
    }

}
