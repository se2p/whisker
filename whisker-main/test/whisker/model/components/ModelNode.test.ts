import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";

describe('Model node', () => {
    test("constructor", () => {
        expect(() => {
            new ModelNode("id", "label");
        }).not.toThrow();
        expect(() => {
            new ModelNode(undefined, "label");
        }).toThrow();
        const node = new ModelNode("id", undefined);
        expect(node.label).toBe("id");
    });

    test("Model node functions", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        let node = new ModelNode("id", "label");
        expect(() => {
            node.addOutgoingEdge(edge);
        }).toThrow();
        node = new ModelNode("from", "label");
        expect(() => {
            node.addOutgoingEdge(edge);
        }).not.toThrow();
        expect(node.edges.length).toBe(1);

        expect(() => {
            node.reset();
        }).not.toThrow();
        expect(() => {
            node.simplifyForSave();
        }).not.toThrow();
    });
});
