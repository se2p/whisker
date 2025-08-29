import {ProgramModel} from "../../../../src/whisker/model/components/ProgramModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ProgramModelEdge";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {getDummyTestDriver} from "../mocks/TestDriverMock";
import {getStorageValue, initialiseStorage} from "../../../../src/whisker/model/util/ModelUtil";
import {expect} from "@jest/globals";

describe('AbstractModelTests', () => {
    test('Storage is initialized', () => {
        const graphId = "someGraphId1230123";
        const s = new ModelNode<ProgramModelEdge>("start");
        initialiseStorage(graphId, new Map<string, number>([["someFunction", 3]]));
        const model = new ProgramModel(graphId, "start", {start: s}, {}, [], {someFunction: ["exprType", '(a, b) => a + b']});
        model.registerComponents(getDummyCheckUtility(), getDummyTestDriver());
        const fn = getStorageValue(graphId, "someFunction") as (a, b) => number;
        expect(fn).toBeInstanceOf(Function);
        expect(fn(1, 2)).toEqual(3);
        expect(fn(3, 4)).toEqual(7);

    });
});
