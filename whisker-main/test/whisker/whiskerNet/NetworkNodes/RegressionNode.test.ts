import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/RegressionNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeType";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/ConnectionGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {List} from "../../../../src/whisker/utils/List";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";


describe("regressionNode Tests", () => {
    let regressionNodeNone: RegressionNode;
    let regressionNodeRelu: RegressionNode;

    beforeEach(() => {
        regressionNodeNone = new RegressionNode(1, "WaitEvent-Duration", ActivationFunction.NONE);
        regressionNodeRelu = new RegressionNode(2, "WaitEvent-Duration", ActivationFunction.RELU);
    })

    test("Constructor Test", () => {

        const regressionNode = new RegressionNode(10, "WaitEvent-Duration", ActivationFunction.NONE);
        expect(regressionNode.id).toBe(10);
        expect(regressionNode.activationFunction).toBe(ActivationFunction.NONE);
        expect(regressionNode.type).toBe(NodeType.OUTPUT);
        expect(regressionNode.nodeValue).toBe(0);
        expect(regressionNode.lastActivationValue).toBe(0);
        expect(regressionNode.activationValue).toBe(0)
        expect(regressionNode.activatedFlag).toBe(false)
        expect(regressionNode.activationCount).toBe(0);
        expect(regressionNode.traversed).toBe(false)
        expect(regressionNode.incomingConnections.size()).toBe(0);
        expect(regressionNode.eventParameter).toEqual("WaitEvent-Duration")
    })

    test("Reset Node", () => {
        regressionNodeNone.activationCount = 10;
        regressionNodeNone.activationValue = 2;
        regressionNodeNone.nodeValue = 10;
        regressionNodeNone.lastActivationValue = 2;
        regressionNodeNone.activatedFlag = true;
        regressionNodeNone.traversed = true;
        regressionNodeNone.reset();
        expect(regressionNodeNone.activationCount).toBe(0)
        expect(regressionNodeNone.activationValue).toBe(0)
        expect(regressionNodeNone.nodeValue).toBe(0)
        expect(regressionNodeNone.lastActivationValue).toBe(0)
        expect(regressionNodeNone.activatedFlag).toBe(false)
        expect(regressionNodeNone.traversed).toBe(false)
    })

    test("Equals Test", () => {
        const regressionNode2 = new RegressionNode(1, "WaitEvent-Duration", ActivationFunction.NONE);
        expect(regressionNode2.equals(regressionNodeNone)).toBeTruthy();

        const regressionNode3 = new RegressionNode(2, "WaitEvent-Duration", ActivationFunction.NONE);
        expect(regressionNode3.equals(regressionNodeNone)).toBeFalsy();

        const regressionNode4 = new RegressionNode(1, "MouseMoveEvent-X", ActivationFunction.NONE)
        expect(regressionNode4.equals(regressionNodeNone)).toBeFalsy();

        const regressionNode5 = new RegressionNode(1, "WaitEvent-Duration", ActivationFunction.RELU);
        expect(regressionNode5.equals(regressionNodeNone)).toBeFalsy();

        const biasNode = new BiasNode(1);
        expect(regressionNodeNone.equals(biasNode)).toBeFalsy();
    })

    test("Clone Test", () => {
        const clone = regressionNodeNone.clone();
        expect(clone.id).toEqual(regressionNodeNone.id);
        expect(clone.eventParameter).toEqual(regressionNodeNone.eventParameter)
        expect(clone.activationFunction).toEqual(regressionNodeNone.activationFunction)
        expect(clone.equals(regressionNodeNone)).toBeTruthy();
        expect(clone === regressionNodeNone).toBeFalsy();
    })

    test("getActivationValue Test", () => {
        regressionNodeNone.nodeValue = 10;
        regressionNodeNone.activationCount = 1;
        regressionNodeRelu.nodeValue = -1;
        regressionNodeRelu.activationCount = 1;
        expect(regressionNodeNone.getActivationValue()).toBe(10);
        expect(regressionNodeNone.activationValue).toBe(10);
        expect(regressionNodeRelu.getActivationValue()).toBe(0);
        expect(regressionNodeRelu.activationValue).toBe(0);
        regressionNodeNone.reset();
        expect(regressionNodeNone.getActivationValue()).toBe(0);
        expect(regressionNodeNone.activationValue).toBe(0);

        const regressionNodeNone2 = new RegressionNode(2, "WaitEvent-Duration", ActivationFunction.NONE);
        regressionNodeNone2.nodeValue = 5;
        regressionNodeNone2.activationCount = 10;
        expect(regressionNodeNone2.getActivationValue()).toBe(5);
        expect(regressionNodeNone2.activationValue).toBe(5);
        regressionNodeNone2.reset();
        expect(regressionNodeNone2.getActivationValue()).toBe(0);
        expect(regressionNodeNone2.activationValue).toBe(0);
    })

    test("Test getEventName", () => {
        expect(regressionNodeNone.getEventName()).toEqual("WaitEvent")
    })

    test("toString Test", () => {
        const inputNode = new InputNode(5, "Test");
        const connection = new ConnectionGene(inputNode, regressionNodeNone, 2, true, 1, false);
        const incomingList = new List<ConnectionGene>();
        incomingList.add(connection);
        regressionNodeNone.incomingConnections = incomingList;
        const out = regressionNodeNone.toString();
        expect(out).toContain("RegressionNode{ID: " + 1 +
            ", Value: " + 0 +
            ", ActivationFunction: " + 0 +
            ", InputConnections: " + connection.toString() + "}")
    })
})
