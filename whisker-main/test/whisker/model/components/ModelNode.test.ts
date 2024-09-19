import {ModelNode, SimpleModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ModelEdge, ProgramModelEdge} from "../../../../src/whisker/model/components/ModelEdge";
import {TestDriverMock} from "../TestDriverMock";

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

    test("testEdgeConditions returns null if no condition matches", () => {
        const fn = jest.fn();
        fn.mockReturnValue(null);
        const node = new ModelNode("id", "label");
        node.addOutgoingEdge({from: "id", checkConditions: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn} as unknown as ModelEdge);
        const result = node.testEdgeConditions(null, null, 0, 0);
        expect(result).toBeNull();
        expect(fn).toHaveBeenCalledTimes(5);
    });

    test("testEdgeConditions returns null if no condition matches", () => {
        const tdMock = new TestDriverMock();
        tdMock.totalStepsExecuted = 342342;
        const fn = jest.fn();
        fn.mockReturnValue(null);
        const correctEdgeFn = jest.fn();
        correctEdgeFn.mockReturnValue([]);
        const node = new ModelNode("id", "label");
        const correctEdge = {from: "id", checkConditions: correctEdgeFn, lastTransition: 0} as unknown as ModelEdge;
        node.addOutgoingEdge({from: "id", checkConditions: fn, lastTransition: 0} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn, lastTransition: 0} as unknown as ModelEdge);
        node.addOutgoingEdge(correctEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn, lastTransition: 0} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditions: fn, lastTransition: 0} as unknown as ModelEdge);
        const result = node.testEdgeConditions(tdMock.getTestDriver(), null, 0, 0);
        expect(result).toStrictEqual(correctEdge);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(correctEdge.lastTransition).toBe(342343);
    });

    test("testForEvent returns null if no event matches", () => {
        const fn = jest.fn().mockReturnValue(null);
        const node = new ModelNode("id", "label");
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn} as unknown as ModelEdge);
        const result = node.testForEvent(null, null, 0, 0, []);
        expect(result).toBeNull();
        expect(fn).toHaveBeenCalledTimes(3);
    });

    test("testEdgeConditions returns null if no condition matches", () => {
        const tdMock = new TestDriverMock();
        tdMock.totalStepsExecuted = 99999;
        const fn = jest.fn().mockReturnValue(null);
        const correctEdgeFn = jest.fn().mockReturnValue([]);
        const node = new ModelNode("id", "label");
        const correctEdge = {
            from: "id",
            checkConditionsOnEvent: correctEdgeFn,
            lastTransition: 0
        } as unknown as ModelEdge;
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn, lastTransition: 0} as unknown as ModelEdge);
        node.addOutgoingEdge(correctEdge);
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn, lastTransition: 0} as unknown as ModelEdge);
        node.addOutgoingEdge({from: "id", checkConditionsOnEvent: fn, lastTransition: 0} as unknown as ModelEdge);
        const result = node.testForEvent(tdMock.getTestDriver(), null, 0, 0, []);
        expect(result).toStrictEqual(correctEdge);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(correctEdge.lastTransition).toBe(100000);
    });

    test("testEdgeConditions returns null if no condition matches", () => {
        const fn = jest.fn();
        const node = new ModelNode("id", "label");
        const count = 13;
        for (let i = 0; i < count; ++i) {
            node.addOutgoingEdge({from: "id", registerComponents: fn} as unknown as ModelEdge);
        }
        node.registerComponents(null, null, false);
        expect(fn).toHaveBeenCalledTimes(count);
    });
});
