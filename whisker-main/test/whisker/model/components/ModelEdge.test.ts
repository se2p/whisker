import {Condition} from "../../../../src/whisker/model/components/Condition";
import {Effect} from "../../../../src/whisker/model/components/Effect";
import {InputEffect, InputEffectName} from "../../../../src/whisker/model/components/InputEffect";
import {TestDriverMock} from "../TestDriverMock";
import {SpriteMock} from "../SpriteMock";
import {CheckUtilityMock, getDummyCheckUtility} from "../CheckUtilityMock";
import {UserModelEdgeJSON, UserModelEdge} from "../../../../src/whisker/model/components/UserModelEdge";
import {ProgramModelEdge, ProgramModelEdgeJSON} from "../../../../src/whisker/model/components/ProgramModelEdge";

describe('Model edges', () => {
    const id = "id";
    const label = "label";
    const graphID = "graphID";
    const from = "from";
    const to = "to";

    function mockCondition(name: string, value: boolean): Condition {
        return {
            id: name,
            check: jest.fn().mockReturnValue(value),
            registerComponents: jest.fn(),
            toString: () => name + ".toString()"
        } as unknown as Condition;
    }

    function mockConditionWithError(name: string, value: string): Condition {
        return {
            id: name,
            check: (s1, s2) => {
                throw new Error(value);
            },
            registerComponents: jest.fn(),
            toString: () => name + ".toString()"
        } as unknown as Condition;
    }

    function mockEffect(fn: jest.Mock): Effect {
        return {registerComponents: fn} as unknown as Effect;
    }

    function mockInputEffectRegister(register: jest.Mock, inputImmediate: jest.Mock): InputEffect {
        return {registerComponents: register, inputImmediate: inputImmediate} as unknown as InputEffect;
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
        const condition = new Condition(id, label, "BackgroundChange", false, ["test"]);
        edge.addCondition(condition);
        expect(edge.conditions.length).toBe(1);
        edge.reset();
        expect(edge.conditions.length).toBe(1);
    });

    test("Program model edge", () => {
        const effect = new Effect(id, label, "BackgroundChange", false, ["test"]);
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new Condition(id, label, "BackgroundChange", false, ["test"]);
        edge.addEffect(effect);
        edge.addCondition(condition);
        expect(edge.effects.length).toBe(1);
    });

    test("User model edge", () => {
        const inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        const edge = new UserModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new Condition(id, label, "BackgroundChange", false, ["test"]);
        edge.addInputEffect(inputEffect);
        edge.addCondition(condition);
        expect(edge.inputEffects.length).toBe(1);
        expect(() => {
            edge.toJSON();
        }).not.toThrow();
    });

    test("ProgramModelEdge.toJSON()", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const effect = new Effect(id, label, "BackgroundChange", false, ["test"]);
        const condition = new Condition(id, label, "BackgroundChange", false, ["test"]);
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
        const inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        const condition = new Condition(id, label, "BackgroundChange", false, ["test"]);
        edge.addInputEffect(inputEffect);
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
            edge.addCondition(new Condition(id, label, "BackgroundChange", false, ["test"]));
            edge.addCondition(new Condition(id, label, "Key", false, ["a"]));
            edge.addCondition(new Condition(id, label, "SpriteTouching", false, ["apple", "bowl"]));
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
            result = edge.checkConditionsOnEvent(11, 9, []);
            expect(result).toStrictEqual(conditions);
        });
    });

    describe("checkConditionsOnEvent()", () => {
        test("checkConditionsOnEvent() returns conditions when event string not contained", () => {
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.addCondition(new Condition(id, label, "BackgroundChange", false, ["test"]));
            edge.addCondition(new Condition(id, label, "Key", false, ["a"]));
            edge.addCondition(new Condition(id, label, "SpriteTouching", false, ["apple", "bowl"]));
            const eventStrings = ["BackgroundChange:differentArg", "Key:w", "Function:false"];
            const result = edge.checkConditionsOnEvent(5, 7, eventStrings);
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
            edge.addCondition(new Condition(id, label, "BackgroundChange", false, ["newBackground"]));
            edge.addCondition(new Condition(id, label, "Key", false, ["d"]));
            edge.addCondition(new Condition(id, label, "SpriteTouching", false, ["banana", "bowl"]));
            const eventStrings = ["BackgroundChange:test", "Key:d", "Function:true"];
            edge.registerComponents(cu, tdMock.getTestDriver());
            const result = edge.checkConditionsOnEvent(5, 7, eventStrings);
            expect(result).toStrictEqual([edge.conditions[0]]);
        });

        test("checkConditionsOnEvent() returns conditions when true is condition and edge has no effect", () => {
            const cu = getDummyCheckUtility();
            const tdMock = new TestDriverMock();
            const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
            edge.addCondition(new Condition(id, label, "BackgroundChange", false, ["newBackground"]));
            edge.addCondition(new Condition(id, label, "Key", false, ["a"]));
            edge.addCondition(new Condition(id, label, "Function", false, ["true"]));
            edge.addEffect(new Effect(id, label, "SpriteTouching", false, ["apple", "bowl"]));
            const eventStrings = ["BackgroundChange:stage", "Key:d"];
            edge.registerComponents(cu, tdMock.getTestDriver());
            const result = edge.checkConditionsOnEvent(5, 7, eventStrings);
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
        edge.addInputEffect(mockInputEffectRegister(fn, null));
        edge.addInputEffect(mockInputEffectRegister(fn, null));
        edge.addInputEffect(mockInputEffectRegister(fn, null));
        edge.addInputEffect(mockInputEffectRegister(fn, null));
        edge.registerComponents(null, null);
        expect(fn).toHaveBeenCalledTimes(4);
    });

    test("UserModelEdge.inputImmediate calls registerComponents on effects", () => {
        const edge = new UserModelEdge("id", "label", "graphId", "from", "to", -1, -1);
        const fn = jest.fn();
        edge.addInputEffect(mockInputEffectRegister(null, fn));
        edge.addInputEffect(mockInputEffectRegister(null, fn));
        edge.inputImmediate(null);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
