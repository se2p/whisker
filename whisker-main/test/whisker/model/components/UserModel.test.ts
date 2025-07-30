import {UserModel} from "../../../../src/whisker/model/components/UserModel";
import {ModelNode, UserModelNode} from "../../../../src/whisker/model/components/ModelNode";
import TestDriver from "../../../../src/test/test-driver";
import {MockedModelNode} from "./ProgramModel.test";
import {getDummyCheckUtility} from "../mocks/CheckUtilityMock";
import {getDummyTestDriver} from "../mocks/TestDriverMock";
import {UserModelEdge} from "../../../../src/whisker/model/components/UserModelEdge";
import {UserModelJSON} from "../../../../src/whisker/model/util/schema";

function getNodesAndEdgesForBiggerModel(): [Record<string, UserModelNode>, Record<string, UserModelEdge>] {
    const nodes: Record<string, UserModelNode> = {
        start: new ModelNode("start", undefined),
        n1: new ModelNode("n1", undefined),
        n2: new ModelNode("n2", undefined),
        n3: new ModelNode("n3", undefined),
        end: new ModelNode("end", undefined),
    };
    const edges: Record<string, UserModelEdge> = {
        "1": new UserModelEdge("1", "e1", "graphID", "start", "n1", -1, -1),
        "2": new UserModelEdge("2", "e2", "graphID", "n1", "n2", 1000, -1),
        "3": new UserModelEdge("3", "e3", "graphID", "n2", "n3", -1, 200),
        "4": new UserModelEdge("4", "e4", "graphID", "n3", "n1", 1, 200),
        "5": new UserModelEdge("5", "e5", "graphID", "n3", "end", 1, 200),
    };
    return [nodes, edges];
}

function getBiggerModel(): [UserModel, Record<string, UserModelNode>, Record<string, UserModelEdge>] {
    const [nodes, edges] = getNodesAndEdgesForBiggerModel();
    return [new UserModel("id", "start", nodes, edges, [], {}), nodes, edges];
}

describe('User model', () => {
    describe('Invalid constructor calls', () => {
        test("Constructor throws for undefined id", () => {
            expect(() => {
                new UserModel(undefined, "start", {start: new ModelNode("start", "label")}, {},
                    [], {});
            }).toThrow();
        });

        test("Constructor throws for undefined startNode", () => {
            expect(() => {
                new UserModel("id", undefined, {start: new ModelNode("start", "label")}, {},
                    [], {});
            }).toThrow();
        });

        test("Constructor throws when startNode ids do not match", () => {
            expect(() => {
                new UserModel("id", "n", {start: new ModelNode("start", "label")}, {},
                    [], {});
            }).toThrow();
        });
    });

    test("toJSON", () => {
        const edges: Record<string, UserModelEdge> = {};
        edges["1"] = new UserModelEdge("1", "label", "graphID", "from", "to", -1, -1);
        edges["2"] = new UserModelEdge("2", "label", "graphID", "from", "to", 1000, -1);
        edges["3"] = new UserModelEdge("3", "label", "graphID", "from", "to", -1, 200);
        edges["4"] = new UserModelEdge("4", "label", "graphID", "from", "to", 1, 200);
        const p = new UserModel("id", "start", {start: new ModelNode("start", "label")},
            edges, [], {});
        const actual = p.toJSON();
        const expected: UserModelJSON = {
            usage: "user",
            id: p.id,
            startNodeId: "start",
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
            ],
            initialStorage: {}
        };
        expect(actual).toStrictEqual(expected);
    });

    test("UserModel is initially not stopped", () => {
        const node = new ModelNode<UserModelEdge>("start", "label");
        const edge = new UserModelEdge("start", "label", "id", node.id, node.id, -1, -1);
        node.addOutgoingEdge(edge);
        const p = new UserModel("id", "start", {start: node}, {edge: edge}, [], {});
        expect(p.stopped()).toBe(false);
    });

    test("SetTransitionStart changes two values", () => {
        const p = new UserModel("id", "start", {start: new ModelNode("start", "label")}, {}, [], {});
        p.setTransitionsStartTo(3);
        expect(p.secondLastTransitionStep).toBe(3);
        expect(p.lastTransitionStep).toBe(3);
    });

    test("registerComponents() registers all nodes", () => {
        const fn = jest.fn();
        const nodes: Record<string, UserModelNode> = {
            start: new ModelNode("start", "label"),
            n1: new ModelNode("n1", "n1"),
            n2: new ModelNode("n2", "n2"),
            n3: new ModelNode("n3", "n3"),
        };
        Object.values(nodes).forEach(n => n.registerComponents = fn);
        const model = new UserModel("model", "start", nodes, {}, [], {});
        const cu = getDummyCheckUtility();
        const t = getDummyTestDriver();
        model.registerComponents(cu, t);
        expect(fn).toBeCalledTimes(4);
        expect(fn).toHaveBeenCalledWith(cu, t);
    });

    test("Reset() resets transition steps", () => {
        const model = getBiggerModel()[0];
        model.setTransitionsStartTo(3);
        model.reset();
        expect(model.lastTransitionStep).toBe(0);
        expect(model.secondLastTransitionStep).toBe(0);
    });

    // test("Reset() resets to start node", () => {
    //     const nodes: Record<string, UserModelNode> = {
    //         start: new ModelNode("start", "label"),
    //         n1: new ModelNode("n1", "n1"),
    //         n2: new ModelNode("n2", "n2")
    //     };
    //     const model = new MockedUserModel("model", "start", nodes, {}, []);
    //     model.currentStateOfModel = nodes["n2"];
    //     model.reset();
    //     expect(model.currentStateOfModel).toBe(nodes["start"]);
    // });

    test("Reset() calls node.reset() for every node", () => {
        const fn = jest.fn();
        const nodes: Record<string, UserModelNode> = {
            start: new MockedModelNode("start", "label", fn),
            n1: new MockedModelNode("n1", "n1", fn),
            n2: new MockedModelNode("n1", "n2", fn)
        };
        const model = new UserModel("model", "start", nodes, {}, [], {});
        model.reset();
        expect(fn).toBeCalledTimes(3);
    });

    test("MakeOneTransition()", () => {
        const [model, nodes, edges] = getBiggerModel();
        let stepCount = 0;
        const t = {getTotalStepsExecuted: () => ++stepCount} as TestDriver;
        const fn = jest.fn();
        nodes["start"].testEdgeConditions = (t, cu, s1, s2) => {
            fn(t, cu, s1, s2);
            return edges["1"];
        };
        model.stepNbrOfProgramEnd = 5;
        model.makeOneTransition(t, null);
        expect(fn).toHaveBeenCalledWith(t, null, 1, 5);
    });
});
