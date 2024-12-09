import {UserInput} from "../../../../src/whisker/model/components/UserInput";
import {TestDriverMock} from "../TestDriverMock";
import {SpriteMock} from "../SpriteMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import {UserModelEdge} from "../../../../src/whisker/model/components/UserModelEdge";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ProgramModelEdge";
import {ProgramModelEdgeJSON, UserModelEdgeJSON} from "../../../../src/whisker/model/util/schema";
import {BackgroundChange} from "../../../../src/whisker/model/checks/BackgroundChange";
import {Key} from "../../../../src/whisker/model/checks/Key";
import {SpriteTouching} from "../../../../src/whisker/model/checks/SpriteTouching";
import {Expr} from "../../../../src/whisker/model/checks/Expr";
import {Checks} from "../../../../src/whisker/model/util/Checks";
import {Check} from "../../../../src/whisker/model/checks/newCheck";

describe('Model edges', () => {
    const id = "id";
    const label = "label";
    const graphID = "graphID";
    const from = "from";
    const to = "to";

    function mockCondition(name: string, value: boolean): Check {
        return {
            check: jest.fn().mockReturnValue(value),
            registerComponents: jest.fn(),
            toString: () => name + ".toString()"
        } as unknown as Check;
    }

    function mockConditionWithError(name: string, value: string): Check {
        return {
            check: (s1, s2) => {
                throw new Error(value);
            },
            registerComponents: jest.fn(),
            toString: () => name + ".toString()"
        } as unknown as Check;
    }

    function mockEffect(fn: jest.Mock): Check {
        return {registerComponents: fn} as unknown as Check;
    }

    function mockInputEffectRegister(register: jest.Mock, inputImmediate: jest.Mock): UserInput {
        return {registerComponents: register, inputImmediate: inputImmediate} as unknown as UserInput;
    }

    describe("constructor", () => {
        const params: [number, number][] = [
            [-1, -1],
            [1000, -1],
            [100, -1],
            [-1, 200],
            [1, 200],
            [-100, -1],
            [-1, -100]
        ];
        it.each(params)('constructor does not throw for %d an %d', (a: number, b: number) => {
            expect(() => new ProgramModelEdge(id, label, graphID, from, to, a, b)).not.toThrow();
            expect(() => new UserModelEdge(id, label, graphID, from, to, a, b)).not.toThrow();
        });

        test('ProgramModelEdge constructor throws for undefined id', () => {
            expect(() => {
                new ProgramModelEdge(undefined, label, graphID, from, to, -1, -1);
            }).toThrow();
        });

        test('UserModelEdge constructor throws for undefined id', () => {
            expect(() => {
                new UserModelEdge(undefined, label, graphID, from, to, -1, -1);
            }).toThrow();
        });

    });

    test("Last transition initialized with zero", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        expect(edge.lastTransition).toBe(0);
    });

    test("Getter function properly", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, 10, -2);
        expect(edge.getEndNodeId()).toBe(to);
        expect(edge.from).toBe(from);
        expect(edge.forceTestAfter).toBe(10);
        expect(edge.forceTestAt).toBe(-1);
        expect(edge.id).toBe(id);
        expect(edge.label).toBe(label);
    });

    test("Reset does not clear conditions on ModelEdge", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new BackgroundChange(label, {negated: false, args: ["test"]});
        edge.addCondition(condition);
        expect(edge.conditions.length).toBe(1);
        edge.reset();
        expect(edge.conditions.length).toBe(1);
    });

    test("Program model edge", () => {
        const effect = new BackgroundChange(label, {negated: false, args: ["test"]});
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new BackgroundChange(label, {negated: false, args: ["test"]});
        edge.addEffect(effect);
        edge.addCondition(condition);
        expect(edge.effects.length).toBe(1);
    });

    test("User model edge", () => {
        const inputEffect = new UserInput("id", "InputKey", ["left"]);
        const edge = new UserModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new BackgroundChange(label, {negated: false, args: ["test"]});
        edge.addUserInput(inputEffect);
        edge.addCondition(condition);
        expect(edge.userInputs.length).toBe(1);
        expect(() => {
            edge.toJSON();
        }).not.toThrow();
    });

    test("ProgramModelEdge.toJSON()", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const effect = new BackgroundChange(label, {negated: false, args: ["test"]});
        const condition = new BackgroundChange(label, {negated: false, args: ["test"]});
        edge.addEffect(effect);
        edge.addCondition(condition);
        const actual = edge.toJSON();
        const expected: ProgramModelEdgeJSON = {
            id: id,
            label: label,
            to: to,
            from: from,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [condition.toJSON()],
            effects: [effect.toJSON()],
        };
        expect(actual).toStrictEqual(expected);
    });

    test("UserModelEdge.toJSON()", () => {
        const edge = new UserModelEdge(id, label, graphID, from, to, -1, -1);
        const inputEffect = new UserInput("id", "InputKey", ["left"]);
        const condition = new BackgroundChange(label, {negated: false, args: ["test"]});
        edge.addUserInput(inputEffect);
        edge.addCondition(condition);
        const actual = edge.toJSON();
        const expected: UserModelEdgeJSON = {
            id: id,
            label: label,
            to: to,
            from: from,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [condition.toJSON()],
            effects: [inputEffect.toJSON()],
        };
        expect(actual).toStrictEqual(expected);
    });

    describe('checkConditions()', () => {
        test("checkConditions() returns conditions when no step happened", () => {
            const tdMock = new TestDriverMock([], 10);
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.lastTransition = 11;
            edge.addCondition(new BackgroundChange(label, {negated: false, args: ["test"]}));
            edge.addCondition(new Key(label, {negated: false, args: ["a"]}));
            edge.addCondition(new SpriteTouching(label, {negated: false, args: ["apple", "bowl"]}));
            const result = edge.checkConditions(tdMock.getTestDriver(), null, 5, 7);
            expect(result).toBe(edge.conditions);
        });

        test("checkConditions() returns failed conditions (no time limit)", () => {
            const errorFn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.addErrorOutput = errorFn;
            const cu = cuMock.getCheckUtility();
            const tdMock = new TestDriverMock([], 5);
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            const conditions = [
                mockCondition("cond0", true),
                mockCondition("cond1", false),
                mockCondition("cond2", true),
                mockCondition("cond3", true),
                mockCondition("cond4", false),
                mockConditionWithError("cond5", "this should happen")
            ];
            conditions.forEach(condition => edge.addCondition(condition));
            const result = edge.checkConditions(tdMock.getTestDriver(), cu, 5, 7);
            expect(result).toStrictEqual([conditions[1], conditions[4], conditions[5]]);
        });

        test("checkConditions() returns failed conditions (total steps exceeded)", () => {
            const errorFn = jest.fn();
            const timeFn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.addErrorOutput = errorFn;
            cuMock.addTimeLimitFailOutput = timeFn;
            const cu = cuMock.getCheckUtility();
            const tdMock = new TestDriverMock([], 43);
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, 42);
            const conditions = [
                mockCondition("cond00", false),
                mockCondition("cond10", true),
                mockCondition("cond20", true),
                mockCondition("cond30", true),
                mockConditionWithError("cond40", "this should happen"),
                mockCondition("cond50", true),
            ];
            conditions.forEach(condition => edge.addCondition(condition));
            edge.registerComponents(cu, tdMock.getTestDriver());
            const result = edge.checkConditions(tdMock.getTestDriver(), cu, 5, 7);
            expect(result).toStrictEqual([conditions[0], conditions[4]]);
            expect(timeFn).toHaveBeenCalledWith("graphID-label: cond00.toString() at 42ms");
        });

        test("checkConditions() returns failed conditions (total steps exceeded)", () => {
            const errorFn = jest.fn();
            const timeFn = jest.fn();
            const cuMock = new CheckUtilityMock();
            cuMock.addErrorOutput = errorFn;
            cuMock.addTimeLimitFailOutput = timeFn;
            const cu = cuMock.getCheckUtility();
            const tdMock = new TestDriverMock([]);
            const edge = new ProgramModelEdge(id, label, graphID, from, to, 10, -1);
            const conditions = [
                mockConditionWithError("cond40", "this should happen"),
                mockCondition("cond00", false),
                mockCondition("cond30", true),
                mockCondition("cond50", true),
            ];
            conditions.forEach(condition => edge.addCondition(condition));
            edge.registerComponents(cu, tdMock.getTestDriver());
            let result = edge.checkConditions(tdMock.getTestDriver(), cu, 11, 9);
            expect(result).toStrictEqual([conditions[0], conditions[1]]);
            expect(timeFn).toHaveBeenCalledWith("graphID-label: cond00.toString() after 10ms");
            result = edge.checkConditions(tdMock.getTestDriver(), cu, 11, 9);
            expect(result).toStrictEqual(conditions);
            result = edge.checkConditionsOnEvent(11, 9, new Checks());
            expect(result).toStrictEqual(conditions);
        });
    });

    describe("checkConditionsOnEvent()", () => {
        test("checkConditionsOnEvent() returns conditions when event string not contained", () => {
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.addCondition(new BackgroundChange(label, {negated: false, args: ["test"]}));
            edge.addCondition(new Key(label, {negated: false, args: ["a"]}));
            edge.addCondition(new SpriteTouching(label, {negated: false, args: ["apple", "bowl"]}));
            const checks = [
                new BackgroundChange(edge.label, {negated: false, args: ["differentArg"]}),
                new Key(edge.label, {negated: false, args: ["w"]}),
                new Expr(edge.label, {negated: false, args: ["false"]}),
            ];
            const result = edge.checkConditionsOnEvent(5, 7, new Checks(checks));
            expect(result).toBe(edge.conditions);
        });

        test("checkConditionsOnEvent() returns conditions when event string not contained", () => {
            const cuMock = new CheckUtilityMock();
            cuMock.constIsKeyDown = true;
            const cu = cuMock.getCheckUtility();
            const tdMock = new TestDriverMock();
            const stage = new SpriteMock("_stage_");
            stage.currentCostumeName = "stage";
            stage.updateSprite();
            tdMock.stage = stage.sprite;
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.addCondition(new BackgroundChange(label, {negated: false, args: ["newBackground"]}));
            edge.addCondition(new Key(label, {negated: false, args: ["d"]}));
            edge.addCondition(new SpriteTouching(label, {negated: false, args: ["banana", "bowl"]}));
            const checks = [
                new BackgroundChange(edge.label, {negated: false, args: ["test"]}),
                new Key(edge.label, {negated: false, args: ["d"]}),
                new Expr(edge.label, {negated: false, args: ["true"]})
            ];
            edge.registerComponents(cu, tdMock.getTestDriver());
            const result = edge.checkConditionsOnEvent(5, 7, new Checks(checks));
            expect(result).toStrictEqual([edge.conditions[0]]);
        });

        test("checkConditionsOnEvent() returns conditions when true is condition and edge has no effect", () => {
            const cu = getDummyCheckUtility();
            const tdMock = new TestDriverMock();
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.addCondition(new BackgroundChange(label, {negated: false, args: ["newBackground"]}));
            edge.addCondition(new Key(label, {negated: false, args: ["a"]}));
            edge.addCondition(new Expr(label, {negated: false, args: ["true"]}));
            edge.addEffect(new SpriteTouching(label, {negated: false, args: ["apple", "bowl"]}));
            const checks = [
                new BackgroundChange(edge.label, {negated: false, args: ["stage"]}),
                new Key(edge.label, {negated: false, args: ["d"]}),
            ];
            edge.registerComponents(cu, tdMock.getTestDriver());
            const result = edge.checkConditionsOnEvent(5, 7, new Checks(checks));
            expect(result).toStrictEqual(edge.conditions);
        });
    });

    test("ProgramModelEdge.registerComponents calls registerComponents on effects", () => {
        const edge = new ProgramModelEdge("id", "label", "graphId", "from", "to", -1, -1);
        const fn = jest.fn();
        edge.addEffect(mockEffect(fn));
        edge.addEffect(mockEffect(fn));
        edge.addEffect(mockEffect(fn));
        edge.registerComponents(null, null);
        expect(fn).toHaveBeenCalledTimes(3);
    });

    test("UserModelEdge.registerComponents calls registerComponents on effects", () => {
        const edge = new UserModelEdge("id", "label", "graphId", "from", "to", -1, -1);
        const fn = jest.fn();
        edge.addUserInput(mockInputEffectRegister(fn, null));
        edge.addUserInput(mockInputEffectRegister(fn, null));
        edge.addUserInput(mockInputEffectRegister(fn, null));
        edge.addUserInput(mockInputEffectRegister(fn, null));
        edge.registerComponents(null, null);
        expect(fn).toHaveBeenCalledTimes(4);
    });

    test("UserModelEdge.inputImmediate calls registerComponents on effects", () => {
        const edge = new UserModelEdge("id", "label", "graphId", "from", "to", -1, -1);
        const fn = jest.fn();
        edge.addUserInput(mockInputEffectRegister(null, fn));
        edge.addUserInput(mockInputEffectRegister(null, fn));
        edge.inputImmediate(null);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
