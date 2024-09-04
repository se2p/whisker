import {SimpleUserModel, UserModel} from "../../../../src/whisker/model/components/UserModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {UserModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('User model', () => {
    describe('Invalid constructor calls', () => {
        test("Constructor throws for undefined id", () => {
            expect(() => {
                new UserModel(undefined, "start", {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });

        test("Constructor throws for undefined startNode", () => {
            expect(() => {
                new UserModel("id", undefined, {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });

        test("Constructor throws when startNode ids do not match", () => {
            expect(() => {
                new UserModel("id", "n", {start: new ModelNode("start", "label")}, {},
                    [], []);
            }).toThrow();
        });
    });

    test("SimplifyForSave", () => {
        const edges: Record<string, UserModelEdge> = {};
        edges["1"] = new UserModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new UserModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new UserModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new UserModelEdge("4", "label", "graphID", "from", "to", 1, 200);
        const p = new UserModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], []);
        const actual = p.simplifyForSave();
        const expected: SimpleUserModel = {
            id: p.id,
            startNodeId: "start",
            stopNodeIds: [],
            stopAllNodeIds: [],
            nodes: [
                {
                    id: "start",
                    label: "label"
                }
            ],
            edges: [
                {
                    id: "1",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: -1,
                    forceTestAfter: -1,
                    conditions: [],
                    effects: []
                },
                {
                    id: "2",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: -1,
                    forceTestAfter: 1000,
                    conditions: [],
                    effects: []
                },
                {
                    id: "3",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAt: 200,
                    forceTestAfter: -1,
                    conditions: [],
                    effects: []
                },
                {
                    id: "4",
                    label: "label",
                    from: "from",
                    to: "to",
                    forceTestAfter: 1,
                    forceTestAt: 200,
                    conditions: [],
                    effects: []
                },
            ]
        };
        expect(actual).toStrictEqual(expected);
    });

    test("UserModel is initially not stopped", () => {
        const p = new UserModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        expect(p.stopped()).toBe(false);
    });

    test("SetTransitionStart changes two values", () => {
        const p = new UserModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], []);
        p.setTransitionsStartTo(3);
        expect(p.secondLastTransitionStep).toBe(3);
        expect(p.lastTransitionStep).toBe(3);
    });
});
