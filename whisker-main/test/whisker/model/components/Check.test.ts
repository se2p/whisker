import {ArgType, Check} from "../../../../src/whisker/model/components/Check";
import {CheckGenerator} from "../../../../src/whisker/model/util/CheckGenerator";
import {Condition} from "../../../../src/whisker/model/components/Condition";
import {getDummyTestDriver} from "../TestDriverMock";
import {getDummyCheckUtility} from "../CheckUtilityMock";

describe('Check', () => {
    const backUp = [];
    beforeAll(() => {
        backUp[0] = CheckGenerator.getAttributeComparisonCheck;
        backUp[1] = CheckGenerator.getAttributeChangeCheck;
        backUp[2] = CheckGenerator.getBackgroundChangeCheck;
        backUp[3] = CheckGenerator.getFunctionCheck;
        backUp[4] = CheckGenerator.getOutputOnSpriteCheck;
        backUp[5] = CheckGenerator.getVariableChangeCheck;
        backUp[6] = CheckGenerator.getVariableComparisonCheck;
        backUp[7] = CheckGenerator.getSpriteTouchingCheck;
        backUp[8] = CheckGenerator.getSpriteColorTouchingCheck;
        backUp[9] = CheckGenerator.getKeyDownCheck;
        backUp[10] = CheckGenerator.getSpriteClickedCheck;
        backUp[11] = CheckGenerator.getExpressionCheck;
        backUp[12] = CheckGenerator.getProbabilityCheck;
        backUp[13] = CheckGenerator.getTimeElapsedCheck;
        backUp[14] = CheckGenerator.getTimeBetweenCheck;
        backUp[15] = CheckGenerator.getNumberOfClonesCheck;
        backUp[16] = CheckGenerator.getNumberOfClonesCheck;
        backUp[17] = CheckGenerator.getTouchingEdgeCheck;
        backUp[18] = CheckGenerator.getTouchingEdgeCheck;
        backUp[19] = CheckGenerator.getTouchingEdgeCheck;
        backUp[20] = CheckGenerator.getTimeAfterEndCheck;
    });
    afterEach(() => {
        CheckGenerator.getAttributeComparisonCheck = backUp[0];
        CheckGenerator.getAttributeChangeCheck = backUp[1];
        CheckGenerator.getBackgroundChangeCheck = backUp[2];
        CheckGenerator.getFunctionCheck = backUp[3];
        CheckGenerator.getOutputOnSpriteCheck = backUp[4];
        CheckGenerator.getVariableChangeCheck = backUp[5];
        CheckGenerator.getVariableComparisonCheck = backUp[6];
        CheckGenerator.getSpriteTouchingCheck = backUp[7];
        CheckGenerator.getSpriteColorTouchingCheck = backUp[8];
        CheckGenerator.getKeyDownCheck = backUp[9];
        CheckGenerator.getSpriteClickedCheck = backUp[10];
        CheckGenerator.getExpressionCheck = backUp[11];
        CheckGenerator.getProbabilityCheck = backUp[12];
        CheckGenerator.getTimeElapsedCheck = backUp[13];
        CheckGenerator.getTimeBetweenCheck = backUp[14];
        CheckGenerator.getNumberOfClonesCheck = backUp[15];
        CheckGenerator.getNumberOfClonesCheck = backUp[16];
        CheckGenerator.getTouchingEdgeCheck = backUp[17];
        CheckGenerator.getTouchingEdgeCheck = backUp[18];
        CheckGenerator.getTouchingEdgeCheck = backUp[19];
        CheckGenerator.getTimeAfterEndCheck = backUp[20];
    });

    const t = getDummyTestDriver();
    const cu = getDummyCheckUtility();
    const graphID = "graphID";
    const negated = false;

    test('AttrComp', () => {
        const fn = jest.fn();
        CheckGenerator.getAttributeComparisonCheck = fn;
        const args: ArgType[] = ["apple", "x", "<", 5];
        const check = new Condition("id", "label", "AttrComp", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('AttrChange', () => {
        const fn = jest.fn();
        CheckGenerator.getAttributeChangeCheck = fn;
        const args: ArgType[] = ["apple", "size", "-"];
        const check = new Condition("id", "label", "AttrChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('BackgroundChange', () => {
        const fn = jest.fn();
        CheckGenerator.getBackgroundChangeCheck = fn;
        const args: ArgType[] = ["newBackground"];
        const check = new Condition("id", "label", "BackgroundChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", negated, ...args);
    });

    test('Function', () => {
        const fn = jest.fn();
        CheckGenerator.getFunctionCheck = fn;
        const args: ArgType[] = ["() => true"];
        const check = new Condition("id", "label", "Function", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('Output', () => {
        const fn = jest.fn();
        CheckGenerator.getOutputOnSpriteCheck = fn;
        const args: ArgType[] = ["apple", "i have fallen down"];
        const check = new Condition("id", "label", "Output", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('VarChange', () => {
        const fn = jest.fn();
        CheckGenerator.getVariableChangeCheck = fn;
        const args: ArgType[] = ["apple", "x", "+"];
        const check = new Condition("id", "label", "VarChange", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('VarComp', () => {
        const fn = jest.fn();
        CheckGenerator.getVariableComparisonCheck = fn;
        const args: ArgType[] = ["apple", "x", ">=", "7"];
        const check = new Condition("id", "label", "VarComp", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('SpriteTouching', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteTouchingCheck = fn;
        const args: ArgType[] = ["apple", "bowl"];
        const check = new Condition("id", "label", "SpriteTouching", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('SpriteColor', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteColorTouchingCheck = fn;
        const args: ArgType[] = ["apple", 128, 128, 128];
        const check = new Condition("id", "label", "SpriteColor", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('Key', () => {
        const fn = jest.fn();
        CheckGenerator.getKeyDownCheck = fn;
        const args: ArgType[] = ["a"];
        const check = new Condition("id", "label", "Key", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, negated, ...args);
    });

    test('Click', () => {
        const fn = jest.fn();
        CheckGenerator.getSpriteClickedCheck = fn;
        const args: ArgType[] = ["banana"];
        const check = new Condition("id", "label", "Click", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('Expr', () => {
        const fn = jest.fn();
        CheckGenerator.getExpressionCheck = fn;
        const args: ArgType[] = ["$(Cat. x) > 25"];
        const check = new Condition("id", "label", "Expr", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, ...args);
    });

    test('Probability', () => {
        const fn = jest.fn();
        CheckGenerator.getProbabilityCheck = fn;
        const args: ArgType[] = [0.5];
        const check = new Condition("id", "label", "Probability", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('TimeElapsed', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeElapsedCheck = fn;
        const args: ArgType[] = [1000];
        const check = new Condition("id", "label", "TimeElapsed", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('TimeBetween', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeBetweenCheck = fn;
        const args: ArgType[] = [500];
        const check = new Condition("id", "label", "TimeBetween", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('NbrOfClones', () => {
        const fn = jest.fn();
        CheckGenerator.getNumberOfClonesCheck = fn;
        const args: ArgType[] = ["apple", ">=", "1"];
        const check = new Condition("id", "label", "NbrOfClones", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, false, ...args);
    });

    test('NbrOfVisibleClones', () => {
        const fn = jest.fn();
        CheckGenerator.getNumberOfClonesCheck = fn;
        const args: ArgType[] = ["apple", "==", "1"];
        const check = new Condition("id", "label", "NbrOfVisibleClones", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, true, ...args);
    });

    test('TouchingEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Condition("id", "label", "TouchingEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple");
    });

    test('TouchingHorizEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Condition("id", "label", "TouchingHorizEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple", false);
    });

    test('TouchingVerticalEdge', () => {
        const fn = jest.fn();
        CheckGenerator.getTouchingEdgeCheck = fn;
        const args: ArgType[] = ["apple"];
        const check = new Condition("id", "label", "TouchingVerticalEdge", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, cu, "label", graphID, negated, "apple", true, false);
    });

    test('TimeAfterEnd', () => {
        const fn = jest.fn();
        CheckGenerator.getTimeAfterEndCheck = fn;
        const args: ArgType[] = [200];
        const check = new Condition("id", "label", "TimeAfterEnd", negated, args);
        check.checkArgsWithTestDriver(t, cu, graphID);
        expect(fn).toBeCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(t, negated, ...args);
    });

    test('Invalid comparison throws error', () => {
        expect(() => {
            const c1 = new Condition("id", "label", "AttrComp", true, ["sprite", "var", "comp", "value"]);
            const c2 = new Condition("id", "label", "AttrComp", true, ["sprite", "var", ">=", "value"]);
            Check.testForContradicting(c1, c2);
        }).toThrow();
    });
});
