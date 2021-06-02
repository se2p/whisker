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

        expect(biasNode.id).toEqual(10);
        expect(biasNode.activationFunction).toEqual(ActivationFunction.NONE);
        expect(biasNode.type).toEqual(NodeType.BIAS);
        expect(biasNode.nodeValue).toEqual(1);
        expect(biasNode.lastActivationValue).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
        expect(biasNode.activatedFlag).toBeTruthy()
        expect(biasNode.activationCount).toEqual(1);
        expect(biasNode.traversed).toBeFalsy()
        expect(biasNode.incomingConnections.size()).toEqual(0);
    })

    test("Reset Node", () =>{
        biasNode.reset();
        expect(biasNode.activationCount).toEqual(1)
        expect(biasNode.activationValue).toEqual(1)
        expect(biasNode.nodeValue).toEqual(1)
        expect(biasNode.lastActivationValue).toEqual(1)
        expect(biasNode.activatedFlag).toBeTruthy()
        expect(biasNode.traversed).toBeFalsy()

    })

    test("Equals Test", () =>{
        const biasNode2 = new BiasNode(1);
        expect(biasNode2.equals(biasNode)).toBeTruthy()

        const biasNode3 = new BiasNode(2);
        expect(biasNode3.equals(biasNode)).toBeFalsy()

        const inputNode = new InputNode(1,"Sprite1", "X-Position");
        expect(inputNode.equals(biasNode)).toBeFalsy()
    })

    test("Clone Test", () => {
        const clone = biasNode.clone();
        expect(clone.id).toEqual(biasNode.id);
        expect(clone.equals(biasNode)).toBeTruthy();
        expect(clone === biasNode).toBeFalsy();
    })

    test("getActivationValue Test", () => {
        expect(biasNode.getActivationValue()).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
        biasNode.reset()
        expect(biasNode.getActivationValue()).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
    })

    test("toString Test", () => {
        const out = biasNode.toString();
        expect(out).toContain(`BiasNode{ID: 1\
, Value: 1\
, InputConnections: ${new List<ConnectionGene>()}}`)
    })
})
