import {ModelNode} from "../../../../src/whisker/model/components/ModelNode";
import {ModelEdge} from "../../../../src/whisker/model/components/AbstractEdge";
import {TestDriverMock} from "../mocks/TestDriverMock";
import {ProgramModelEdge} from "../../../../src/whisker/model/components/ProgramModelEdge";
import {ModelNodeJSON} from "../../../../src/whisker/model/util/schema";

describe('Model node', () => {
    function mockModelEdge(id: string, checkConditions: jest.Mock, lastTransition = 0,
                           registerComponents: jest.Mock = jest.fn(), checkConditionsOnEvent: jest.Mock = jest.fn(), isTrueEdge = false): ModelEdge {
        return {
            from: id,
            checkConditions: checkConditions,
            registerComponents: registerComponents,
            checkConditionsOnEvent: checkConditionsOnEvent,
            lastTransition: lastTransition,
            isTrueEdge: () => isTrueEdge,
        } as unknown as ModelEdge;
    }

    test("constructor throws for undefined id", () => {
        expect(() => {
            new ModelNode(undefined, "label");
        }).toThrow();
    });

    test("constructor with undefined label works", () => {
        const node = new ModelNode("id", undefined);
        expect(node.label).toBe("id");
    });

    test("Can't add edge with wrong \"from\"-node (source node)", () => {
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

    test("toJSON", () => {
        const edge = new ProgramModelEdge("id", "label", "graphID", "from", "to", 1000, -1);
        const node = new ModelNode("from", "label");
        node.addOutgoingEdge(edge);
        const actual = node.toJSON();
        const expected: ModelNodeJSON = {
            id: "from",
            label: "label"
        };
        expect(actual).toStrictEqual(expected);
    });

    test("testEdgeConditions returns null if no condition matches", () => {
        const fn = jest.fn();
        fn.mockReturnValue(null);
        const node = new ModelNode("id", "label");
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        const result = node.testEdgeConditions(null, null, 0, 0);
        expect(result).toBeNull();
        expect(fn).toHaveBeenCalledTimes(5);
    });

    test("testEdgeConditions returns the correct edge", () => {
        const tdMock = new TestDriverMock();
        const fn = jest.fn();
        fn.mockReturnValue(null);
        const correctEdgeFn = jest.fn();
        correctEdgeFn.mockReturnValue([]);
        const node = new ModelNode("id", "label");
        const correctEdge = mockModelEdge("id", correctEdgeFn, 0);
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(correctEdge);
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        node.addOutgoingEdge(mockModelEdge("id", fn, 0));
        const result = node.testEdgeConditions(tdMock.getTestDriver(), null, 0, 0);
        expect(result).toStrictEqual(correctEdge);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test("testForEvent checks until one edge is true", () => {
        const tdMock = new TestDriverMock();
        tdMock.totalStepsExecuted = 99999;
        const fn = jest.fn().mockReturnValue(null);
        const correctEdgeFn = jest.fn().mockReturnValue([]);
        const node = new ModelNode("id", "label");
        const correctEdge = mockModelEdge("id", jest.fn(), 0, jest.fn(), correctEdgeFn);
        node.addOutgoingEdge(mockModelEdge("id", jest.fn(), 0, jest.fn(), fn));
        node.addOutgoingEdge(correctEdge);
        node.addOutgoingEdge(mockModelEdge("id", jest.fn(), 0, jest.fn(), fn));
        node.addOutgoingEdge(mockModelEdge("id", jest.fn(), 0, jest.fn(), fn));
        node.testForEvent(0, 0);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(correctEdgeFn).toHaveBeenCalledTimes(1);
    });

    test("registerComponents calls register components of all outgoing edges", () => {
        const fn = jest.fn();
        const node = new ModelNode("id", "label");
        const count = 13;
        for (let i = 0; i < count; ++i) {
            node.addOutgoingEdge(mockModelEdge("id", jest.fn(), 0, fn));
        }
        node.registerComponents(null, null);
        expect(fn).toHaveBeenCalledTimes(count);
    });
});
