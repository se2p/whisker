import {SetStorage, SetStorageArgs} from "../../../../src/whisker/model/checks/SetStorage";
import {getDummyTestDriver} from "../mocks/TestDriverMock";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {initialiseStorage} from "../../../../src/whisker/model/util/ModelUtil";

describe('SetStorageValue', () => {

    const table: [string, SetStorageArgs, Map<string, string | number>][] = [
        ["number", ["var1", "number", 1], new Map([["var1", 1]])],
        ["string", ["var2", "string", "this is some string"], new Map([["var2", "this is some string"]])],
        ["exprType", ["var3", "exprType", "Math.abs(-3)+' some string'"], new Map([["var3", "3 some string"]])],
    ];

    it.each(table)('set storage of %s to value of type %s', (testName, args, expected,) => {
        const graphID = "setStorageTest";
        const check = new SetStorage("label", {negated: false, args: args});
        const storage = new Map();
        initialiseStorage(graphID, storage);
        check.registerComponents(getDummyTestDriver(), getDummyCheckUtility(), graphID);
        expect(check.check().passed).toBe(true);
        expect(storage).toStrictEqual(expected);
    });
});
