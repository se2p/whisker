import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeType";
import {List} from "../../../../src/whisker/utils/List";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/ConnectionGene";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";


describe("InputNode Tests", () => {
    let inputNode: NodeGene

    beforeEach(() => {
        inputNode = new InputNode(1,"Test");
    })

    test("Constructor Test", () => {

        const inputNode = new InputNode(10,"Test");

        expect(inputNode.id).toBe(10);
        expect(inputNode.activationFunction).toBe(ActivationFunction.NONE);
        expect(inputNode.type).toBe(NodeType.INPUT);
        expect(inputNode.nodeValue).toBe(0);
        expect(inputNode.lastActivationValue).toBe(0);
        expect(inputNode.activationValue).toBe(0)
        expect(inputNode.activatedFlag).toBe(false)
        expect(inputNode.activationCount).toBe(0);
        expect(inputNode.traversed).toBe(false)
        expect(inputNode.incomingConnections.size()).toBe(0);
        expect(inputNode.sprite).toBe("Test");
    })

    test("Reset Node", () =>{
        inputNode.activationCount = 10;
        inputNode.activationValue = 2;
        inputNode.nodeValue = 10;
        inputNode.lastActivationValue = 2;
        inputNode.activatedFlag = true;
        inputNode.traversed = true;
        inputNode.reset();
        expect(inputNode.activationCount).toBe(0)
        expect(inputNode.activationValue).toBe(0)
        expect(inputNode.nodeValue).toBe(0)
        expect(inputNode.lastActivationValue).toBe(0)
        expect(inputNode.activatedFlag).toBe(false)
        expect(inputNode.traversed).toBe(false)

    })

    test("Clone Test", () => {
        const clone = inputNode.clone();
        expect(clone.id).toBe(inputNode.id);
        expect(clone.equals(inputNode)).toBe(true);
        expect(clone === inputNode).toBe(false);
    })

    test("Equals Test", () =>{
        const inputNode2 = new InputNode(1,"Test");
        expect(inputNode2.equals(inputNode)).toBe(true)

        const inputNode3 = new InputNode(2,"Test");
        expect(inputNode3.equals(inputNode)).toBe(false)

        const biasNode = new BiasNode(1);
        expect(biasNode.equals(inputNode)).toBe(false)
    })

    test("getActivationValue Test", () => {
        expect(inputNode.getActivationValue()).toBe(0);
        expect(inputNode.activationValue).toBe(0)
        inputNode.nodeValue = 10;
        expect(inputNode.getActivationValue()).toBe(10);
        expect(inputNode.activationValue).toBe(10)
    })

    test("toString Test", () => {
        const out = inputNode.toString();
        expect(out).toContain("InputNode{ID: " + 1 + ", Value: " + 0 +
            ", InputConnections: " + new List<ConnectionGene>() + "}")
    })
})
