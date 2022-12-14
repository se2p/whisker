import {ProgramModelEdge, UserModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {expect} from "@jest/globals";
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
        let edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        expect(edge.lastTransition == 0);
        expect(edge.getEndNodeId() == "to");
        let condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addCondition(condition);
        expect(edge.conditions.length == 1);
        expect(() => {
            edge.reset();
        }).not.toThrow();
    });

    test("Program model edge", () => {
        let effect = new Effect("id", "label", CheckName.BackgroundChange, false, ["test"]);
        let edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        let condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addEffect(effect);
        edge.addCondition(condition);
        expect(edge.effects.length == 1);
        expect(() => {
            edge.simplifyForSave();
        }).not.toThrow();
    });

    test("User model edge", () => {
        let edge = new UserModelEdge("id", "label", "graphID", "from", "to", -1, -1);
        let inputEffect = new InputEffect("id", InputEffectName.InputKey, ["left"]);
        let condition = new Condition("id","label", CheckName.BackgroundChange, false, ["test"]);
        edge.addInputEffect(inputEffect);
        edge.addCondition(condition);
        expect(edge.inputEffects.length == 1);
        expect(() => {
            edge.simplifyForSave();
        }).not.toThrow();
    });
});
