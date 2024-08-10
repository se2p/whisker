import {ProgramModelEdge, UserModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {Condition} from "../../../../src/whisker/model/components/Condition";
import {CheckName} from "../../../../src/whisker/model/components/Check";
import {Effect} from "../../../../src/whisker/model/components/Effect";
import {InputEffect, InputEffectName} from "../../../../src/whisker/model/components/InputEffect";

describe('Model edges', () => {
    test("constructor", () => {
        expect(() => {
            new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
            new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
            new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, 200);
            new ProgramModelEdge("id", "label", "graphID", "from", "to", 1, 200);
        }).not.toThrow();
        expect(() => {
            new ProgramModelEdge("id", "label", "graphID", "from", "to", -100, -1);
            new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -100);
        }).not.toThrow();
        expect(() => {
            new UserModelEdge("id", "label", "graphID", "from", "to", -1, -1);
            new UserModelEdge("id", "label", "graphID", "from", "to", 100, -1);
            new UserModelEdge("id", "label", "graphID", "from", "to", -1, 1);
            new UserModelEdge("id", "label", "graphID", "from", "to", 100, 100);
        }).not.toThrow();
        expect(() => {
            new UserModelEdge("id", "label", "graphID", "from", "to", -100, -1);
            new UserModelEdge("id", "label", "graphID", "from", "to", -1, -100);
        }).not.toThrow();
        expect(() => {
            new ProgramModelEdge(undefined, "label", "graphID", "from", "to", -1, -1);
        }).toThrow();
        expect(() => {
            new UserModelEdge(undefined, "label", "graphID", "from", "to", -1, -1);
        }).toThrow();

    });

    test("Model edge functions", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);

        // expect(edge.lastTransition).toBe(0); // this makes the test fail which is what was "supposed" to be tested.
        expect(edge.lastTransition).toBe(undefined); // with this the test passed -> should probably be removed
        expect(edge._lastTransition).toBe(0); // with this the test also passes.
        /*
        The problem here is that instead of the attribute `ProgramModelEdge._lastTransition` instead the set method
        `ProgramModelEdge.lastTransition` is tested for equality with 0. I suggest the intent was to check if the
        attribute `ProgramModelEdge._lastTransition` has the value `0` which it does have during runtime. I am not too
        familiar with TypeScript, so I am not sure what to do in this case. My suggestion is that here again the test
        should be updated to check for equality of
                `ProgramModelEdge._lastTransition`
        and not `ProgramModelEdge.lastTransition`.
        When checking for occurrences of both the set method and the attribute it seems like in all other cases they
        were used as intended. The set method is only called directly followed by the assignment operator and the
        attribute only in expressions where the value of the attribute is queried. This test is the only case where
        this did not match (at least according to the WebStorm "show usages" feature)
        */

        expect(edge.getEndNodeId()).toBe("to");
        const condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addCondition(condition);
        expect(edge.conditions.length).toBe(1);
        expect(() => {
            edge.reset();
        }).not.toThrow();
    });

    test("Program model edge", () => {
        const effect = new Effect("id", "label", CheckName.BackgroundChange, false, ["test"]);
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        const condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addEffect(effect);
        edge.addCondition(condition);
        expect(edge.effects.length).toBe(1);
        expect(() => {
            edge.simplifyForSave();
        }).not.toThrow();
    });

    test("User model edge", () => {
        const edge = new UserModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        const inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        const condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addInputEffect(inputEffect);
        edge.addCondition(condition);
        expect(edge.inputEffects.length).toBe(1);
        expect(() => {
            edge.simplifyForSave();
        }).not.toThrow();
    });
});
