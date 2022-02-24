import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";


describe("BiasNode Tests", () => {
    let biasNode: NodeGene

    beforeEach(() => {
        biasNode = new BiasNode();
        biasNode.uID = 1;
    })

    test("Constructor Test", () => {

        const biasNode = new BiasNode();

        expect(biasNode.uID).toEqual(1);
        expect(biasNode.activationFunction).toEqual(ActivationFunction.NONE);
        expect(biasNode.type).toEqual(NodeType.BIAS);
        expect(biasNode.nodeValue).toEqual(1);
        expect(biasNode.lastActivationValue).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
        expect(biasNode.activatedFlag).toBeTruthy()
        expect(biasNode.activationCount).toEqual(1);
        expect(biasNode.traversed).toBeFalsy()
        expect(biasNode.incomingConnections.length).toEqual(0);
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
        const biasNode2 = new BiasNode();
        biasNode2.uID = 1;
        expect(biasNode2.equals(biasNode)).toBeTruthy()

        const biasNode3 = new BiasNode();
        biasNode3.uID = 2;
        expect(biasNode3.equals(biasNode)).toBeFalsy()

        const inputNode = new InputNode("Sprite1", "X-Position");
        inputNode.uID = 1;
        expect(inputNode.equals(biasNode)).toBeFalsy()
    })

    test("Clone Test", () => {
        const clone = biasNode.clone();
        expect(clone.uID).toEqual(biasNode.uID);
        expect(clone.equals(biasNode)).toBeTruthy();
        expect(clone === biasNode).toBeFalsy();
    })

    test("getActivationValue Test", () => {
        expect(biasNode.activate()).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
        biasNode.reset()
        expect(biasNode.activate()).toEqual(1);
        expect(biasNode.activationValue).toEqual(1)
    })

    test("toString Test", () => {
        const out = biasNode.toString();
        expect(out).toContain(`BiasNode{ID: 1\
, Value: 1\
, InputConnections: ${[]}`)
    })
})
