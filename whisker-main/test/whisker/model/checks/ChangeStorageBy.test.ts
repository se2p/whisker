import {initialiseStorage} from "../../../../src/whisker/model/util/ModelUtil";
import {getDummyTestDriver} from "../mocks/TestDriverMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {ChangeStorageBy} from "../../../../src/whisker/model/checks/ChangeStorageBy";

describe('IncDecStorage', () => {

    const initialValue = 5;

    const table: [number, Map<string, unknown>][] = [
        [1, new Map([["var1", 6]])],
        [0, new Map([["var1", 5]])],
        [-7, new Map([["var1", -2]])],
    ];

    it.each(table)('increment variable by %s', (change, expected,) => {
        const graphID = "setStorageTest";
        const check = new ChangeStorageBy("label", {negated: false, args: ["var1", change]});
        const storage = new Map([["var1", initialValue]]);
        initialiseStorage(graphID, storage);
        check.registerComponents(getDummyTestDriver(), getDummyCheckUtility(), graphID);
        expect(check.check().passed).toBe(true);
        expect(storage).toStrictEqual(expected);
    });
});
