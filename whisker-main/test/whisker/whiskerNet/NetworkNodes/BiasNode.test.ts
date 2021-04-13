import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeType";
import {List} from "../../../../src/whisker/utils/List";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/ConnectionGene";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/InputNode";


describe("BiasNode Tests", () => {
    let biasNode: NodeGene

    beforeEach(() => {
        biasNode = new BiasNode(1);
    })

    test("Constructor Test", () => {

        const biasNode = new BiasNode(10);

        expect(biasNode.id).toBe(10);
        expect(biasNode.activationFunction).toBe(ActivationFunction.NONE);
        expect(biasNode.type).toBe(NodeType.BIAS);
        expect(biasNode.nodeValue).toBe(1);
        expect(biasNode.lastActivationValue).toBe(1);
        expect(biasNode.activationValue).toBe(1)
        expect(biasNode.activatedFlag).toBe(true)
        expect(biasNode.activationCount).toBe(1);
        expect(biasNode.traversed).toBe(false)
        expect(biasNode.incomingConnections.size()).toBe(0);
    })

    test("Reset Node", () =>{
        biasNode.reset();
        expect(biasNode.activationCount).toBe(1)
        expect(biasNode.activationValue).toBe(1)
        expect(biasNode.nodeValue).toBe(1)
        expect(biasNode.lastActivationValue).toBe(1)
        expect(biasNode.activatedFlag).toBe(true)
        expect(biasNode.traversed).toBe(false)

    })

    test("Equals Test", () =>{
        const biasNode2 = new BiasNode(1);
        expect(biasNode2.equals(biasNode)).toBe(true)

        const inputNode3 = new InputNode(2,"Test");
        expect(inputNode3.equals(biasNode)).toBe(false)

        const inputNode = new InputNode(1,"Test");
        expect(inputNode.equals(biasNode)).toBe(false)
    })

    test("Clone Test", () => {
        const clone = biasNode.clone();
        expect(clone.id).toBe(biasNode.id);
        expect(clone.equals(biasNode)).toBe(true);
        expect(clone === biasNode).toBe(false);
    })

    test("getActivationValue Test", () => {
        expect(biasNode.getActivationValue()).toBe(1);
        expect(biasNode.activationValue).toBe(1)
        biasNode.reset()
        expect(biasNode.getActivationValue()).toBe(1);
        expect(biasNode.activationValue).toBe(1)
    })

    test("toString Test", () => {
        const out = biasNode.toString();
        expect(out).toContain("BiasNode{ID: " + 1 + ", Value: " + 1 +
            ", InputConnections: " + new List<ConnectionGene>() + "}")
    })
})
