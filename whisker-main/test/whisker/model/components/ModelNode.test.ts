import {ModelNode, SimpleModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('Model node', () => {
    test("constructor throws for undefined id", () => {
        expect(() => {
            new ModelNode(undefined, "label");
        }).toThrow();
    });

    test("constructor with undefined label works", () => {
        const node = new ModelNode("id", undefined);
        expect(node.label).toBe("id");
    });

    test("Can't add edge with wrong from node", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        const node = new ModelNode("id", "label");
        expect(() => {
            node.addOutgoingEdge(edge);
        }).toThrow();
    });

    test("Model add a valid edge increases the amount of edges", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        const node = new ModelNode("from", "label");
        node.addOutgoingEdge(edge);
        expect(node.edges.length).toBe(1);
    });

    test("reset() calls reset() of edges", () => {
        const edge1 = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        const edge2 = new ProgramModelEdge("id", "label", "graphID", "from", "to2", 1000, -1);
        const node = new ModelNode("from", "label");
        node.addOutgoingEdge(edge1);
        node.addOutgoingEdge(edge2);
        edge1.lastTransition = 1;
        edge2.lastTransition = 2;
        node.reset();
        expect(edge1.lastTransition).toBe(0);
        expect(edge2.lastTransition).toBe(0);
    });

    test("SimplifyForSave", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        const node = new ModelNode("from", "label");
        node.addOutgoingEdge(edge);
        const actual = node.simplifyForSave();
        const expected: SimpleModelNode = {
            id: "from",
            label: "label"
        };
        expect(actual).toStrictEqual(expected);
    });
});
