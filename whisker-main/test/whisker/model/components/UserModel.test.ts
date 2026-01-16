import {UserModel} from "../../../../src/whisker/model/components/UserModel";
import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {UserModelEdge} from "../../../../src/whisker/model/components/UserModelEdge";
import {UserModelJSON} from "../../../../src/whisker/model/util/schema";

describe('User model', () => {
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
            maxDuration: UserModel.NO_DURATION,
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
});
