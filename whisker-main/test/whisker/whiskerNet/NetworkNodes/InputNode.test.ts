import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkNodes/NodeType";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/ConnectionGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkNodes/BiasNode";


describe("InputNode Tests", () => {
    let inputNode: InputNode

    beforeEach(() => {
        inputNode = new InputNode(1, "Sprite1", "X-Position");
    })

    test("Constructor Test", () => {
        expect(inputNode.id).toEqual(1);
        expect(inputNode.activationFunction).toEqual(ActivationFunction.NONE);
        expect(inputNode.type).toEqual(NodeType.INPUT);
        expect(inputNode.nodeValue).toEqual(0);
        expect(inputNode.lastActivationValue).toEqual(0);
        expect(inputNode.activationValue).toEqual(0)
        expect(inputNode.activatedFlag).toBeFalsy();
        expect(inputNode.activationCount).toEqual(0);
        expect(inputNode.traversed).toBeFalsy();
        expect(inputNode.incomingConnections.length).toEqual(0);
        expect(inputNode.sprite).toEqual("Sprite1");
        expect(inputNode.feature).toEqual("X-Position");
    })

    test("Reset Node", () => {
        inputNode.activationCount = 10;
        inputNode.activationValue = 2;
        inputNode.nodeValue = 10;
        inputNode.lastActivationValue = 2;
        inputNode.activatedFlag = true;
        inputNode.traversed = true;
        inputNode.reset();
        expect(inputNode.activationCount).toEqual(0)
        expect(inputNode.activationValue).toEqual(0)
        expect(inputNode.nodeValue).toEqual(0)
        expect(inputNode.lastActivationValue).toEqual(0)
        expect(inputNode.activatedFlag).toBeFalsy();
        expect(inputNode.traversed).toBeFalsy();

    })

    test("Clone Test", () => {
        const clone = inputNode.clone();
        expect(clone.id).toEqual(inputNode.id);
        expect(clone.equals(inputNode)).toBeTruthy();
        expect(clone === inputNode).toBeFalsy();
    })

    test("Equals Test", () => {
        const inputNode2 = new InputNode(1, "Sprite1", "X-Position");
        expect(inputNode2.equals(inputNode)).toBeTruthy();

        const inputNode3 = new InputNode(2, "Sprite1", "X-Position");
        expect(inputNode3.equals(inputNode)).toBeFalsy();

        const inputNode4 = new InputNode(2, "Sprite2", "X-Position");
        expect(inputNode4.equals(inputNode)).toBeFalsy();

        const inputNode5 = new InputNode(2, "Sprite1", "Y-Position");
        expect(inputNode5.equals(inputNode)).toBeFalsy();

        const biasNode = new BiasNode(1);
        expect(biasNode.equals(inputNode)).toBeFalsy();
    })

    test("getActivationValue Test", () => {
        expect(inputNode.getActivationValue()).toEqual(0);
        expect(inputNode.activationValue).toEqual(0)
        inputNode.nodeValue = 10;
        expect(inputNode.getActivationValue()).toEqual(10);
        expect(inputNode.activationValue).toEqual(10)
    })

    test("toString Test", () => {
        const out = inputNode.toString();
        expect(out).toContain(`InputNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}\
, Sprite: Sprite1\
, Feature: X-Position}`)
    })
})
