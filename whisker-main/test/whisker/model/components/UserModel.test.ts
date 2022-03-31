import {expect} from "@jest/globals";
import {UserModel} from "../../../../src/whisker/model/components/UserModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {UserModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('User model', () => {
    test("User model constructor", () => {
        expect(() => {
            new UserModel("id", "start", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).not.toThrow();
        expect(() => {
            new UserModel(undefined, "start", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
        expect(() => {
            new UserModel("id", undefined, {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
        expect(() => {
            new UserModel("id", "n", {start: new ModelNode("start", "label")}, {},
                [], []);
        }).toThrow();
    });

    test("User model: coverage without run", () => {
        let edges = {};
        edges["1"] = new UserModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new UserModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new UserModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new UserModelEdge("4", "label", "graphID", "from", "to", 1, 200);

        let p = new UserModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], []);

        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
    });

    test("User model: functions", () => {
        let p = new UserModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.stopped() == false);
        expect(() => {
            p.reset();
        }).not.toThrow();
        expect(() => {
            p.simplifyForSave();
        }).not.toThrow();
        p.setTransitionsStartTo(3);
        expect(p.lastTransitionStep == 3);
        expect(p.secondLastTransitionStep == 3);
    });
});
