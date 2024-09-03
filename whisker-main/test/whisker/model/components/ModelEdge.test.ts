import {
    ProgramModelEdge,
    SimpleProgramModelEdge, SimpleUserModelEdge,
    UserModelEdge
} from "../../../../src/whisker/model/components/ModelEdge";
import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {Effect} from "../../../../src/whisker/model/components/Effect";
import {InputEffect, InputEffectName} from "../../../../src/whisker/model/components/InputEffect";

describe('Model edges', () => {
    const id = "id";
    const label = "label";
    const graphID = "graphID";
    const from = "from";
    const to = "to";

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
        const condition = new Condition(id, label, CheckName.BackgroundChange, false, ["test"]);
        edge.addCondition(condition);
        expect(edge.conditions.length).toBe(1);
        edge.reset();
        expect(edge.conditions.length).toBe(1);
    });

    test("Program model edge", () => {
        const effect = new Effect(id, label, CheckName.BackgroundChange, false, ["test"]);
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new Condition(id, label, CheckName.BackgroundChange, false, ["test"]);
        edge.addEffect(effect);
        edge.addCondition(condition);
        expect(edge.effects.length).toBe(1);
    });

    test("User model edge", () => {
        const inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        const edge = new UserModelEdge(id, label, graphID, from, to, -1, -1);
        const condition = new Condition(id, label, CheckName.BackgroundChange, false, ["test"]);
        edge.addInputEffect(inputEffect);
        edge.addCondition(condition);
        expect(edge.inputEffects.length).toBe(1);
        expect(() => {
            edge.simplifyForSave();
        }).not.toThrow();
    });

    test("ProgramModelEdge.SimplifyForSave()", () => {
        const edge = new ProgramModelEdge(id, label, graphID, from, to, -1, -1);
        const effect = new Effect(id, label, CheckName.BackgroundChange, false, ["test"]);
        const condition = new Condition(id, label, CheckName.BackgroundChange, false, ["test"]);
        edge.addEffect(effect);
        edge.addCondition(condition);
        const actual = edge.simplifyForSave();
        const expected: SimpleProgramModelEdge = {
            id: id,
            label: label,
            to: to,
            from: from,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [condition.simplifyForSave()],
            effects: [effect.simplifyForSave()],
        };
        expect(actual).toStrictEqual(expected);
    });

    test("UserModelEdge.SimplifyForSave()", () => {
        const edge = new UserModelEdge(id, label, graphID, from, to, -1, -1);
        const inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        const condition = new Condition(id, label, CheckName.BackgroundChange, false, ["test"]);
        edge.addInputEffect(inputEffect);
        edge.addCondition(condition);
        const actual = edge.simplifyForSave();
        const expected: SimpleUserModelEdge = {
            id: id,
            label: label,
            to: to,
            from: from,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [condition.simplifyForSave()],
            effects: [inputEffect.simplifyForSave()],
        };
        expect(actual).toStrictEqual(expected);
    });
});
