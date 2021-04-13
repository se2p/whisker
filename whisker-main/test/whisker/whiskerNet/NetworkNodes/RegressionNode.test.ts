import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/RegressionNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeType";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/ConnectionGene";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {List} from "../../../../src/whisker/utils/List";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";


describe("regressionNode Tests", () => {
    let regressionNode: NodeGene

    beforeEach(() => {
        regressionNode = new RegressionNode(1);
    })

    test("Constructor Test", () => {

        const regressionNode = new RegressionNode(10);

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
    })

    test("Reset Node", () =>{
        regressionNode.activationCount = 10;
        regressionNode.activationValue = 2;
        regressionNode.nodeValue = 10;
        regressionNode.lastActivationValue = 2;
        regressionNode.activatedFlag = true;
        regressionNode.traversed = true;
        regressionNode.reset();
        expect(regressionNode.activationCount).toBe(0)
        expect(regressionNode.activationValue).toBe(0)
        expect(regressionNode.nodeValue).toBe(0)
        expect(regressionNode.lastActivationValue).toBe(0)
        expect(regressionNode.activatedFlag).toBe(false)
        expect(regressionNode.traversed).toBe(false)
    })

    test("Equals Test", () =>{
        const regressionNode2 = new RegressionNode(1);
        expect(regressionNode2.equals(regressionNode)).toBe(true)

        const regressionNode3 = new RegressionNode(2);
        expect(regressionNode3.equals(regressionNode)).toBe(false)

        const biasNode = new BiasNode(1);
        expect(regressionNode.equals(biasNode)).toBe(false)
    })

    test("Clone Test", () => {
        const clone = regressionNode.clone();
        expect(clone.id).toBe(regressionNode.id);
        expect(clone.equals(regressionNode)).toBe(true);
        expect(clone === regressionNode).toBe(false);
    })

    test("getActivationValue Test", () => {
        regressionNode.nodeValue = 10;
        regressionNode.activationCount = 1;
        expect(regressionNode.getActivationValue()).toBe(10);
        expect(regressionNode.activationValue).toBe(10)
        regressionNode.reset()
        expect(regressionNode.getActivationValue()).toBe(0);
        expect(regressionNode.activationValue).toBe(0);

        const regressionNode2 = new RegressionNode(2)
        regressionNode2.nodeValue = 5;
        regressionNode2.activationCount = 10;
        expect(regressionNode2.getActivationValue()).toBe(5);
        expect(regressionNode2.activationValue).toBe(5)
        regressionNode2.reset()
        expect(regressionNode2.getActivationValue()).toBe(0);
        expect(regressionNode2.activationValue).toBe(0);
    })

    test("toString Test", () => {
        const inputNode = new InputNode(5, "Test");
        const connection = new ConnectionGene(inputNode, regressionNode,2,true,1,false);
        const incomingList = new List<ConnectionGene>();
        incomingList.add(connection);
        regressionNode.incomingConnections = incomingList;
        const out = regressionNode.toString();
        expect(out).toContain("RegressionNode{ID: " + 1 + ", Value: " + 0 +
            ", InputConnections: " + connection.toString() + "}")
    })
})
