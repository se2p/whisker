import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";


describe("InputNode Tests", () => {
    let inputNode: InputNode

    beforeEach(() => {
        inputNode = new InputNode("Sprite1", "X-Position");
        inputNode.uID = 1;
    })

    test("Constructor Test", () => {
        expect(inputNode.uID).toEqual(1);
        expect(inputNode.activationFunction).toEqual(ActivationFunction.NONE);
        expect(inputNode.type).toEqual(NodeType.INPUT);
        expect(inputNode.nodeValue).toEqual(0);
        expect(inputNode.lastActivationValue).toEqual(0);
        expect(inputNode.activationValue).toEqual(undefined)
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
        expect(inputNode.activationCount).toEqual(0);
        expect(inputNode.activationValue).toEqual(0);
        expect(inputNode.nodeValue).toEqual(0);
        expect(inputNode.lastActivationValue).toEqual(0);
        expect(inputNode.activatedFlag).toBeFalsy();
        expect(inputNode.traversed).toBeFalsy();

    })

    test("Clone Test", () => {
        const clone = inputNode.clone();
        expect(clone.uID).toEqual(inputNode.uID);
        expect(clone.equals(inputNode)).toBeTruthy();
        expect(clone === inputNode).toBeFalsy();
    })

    test("Equals Test", () => {
        const inputNode2 = new InputNode("Sprite1", "X-Position");
        inputNode2.uID = 1;
        expect(inputNode2.equals(inputNode)).toBeTruthy();

        const inputNode3 = new InputNode("Sprite1", "X-Position");
        inputNode3.uID = 2;
        expect(inputNode3.equals(inputNode)).toBeFalsy();

        const inputNode4 = new InputNode("Sprite2", "X-Position");
        inputNode4.uID = 2;
        expect(inputNode4.equals(inputNode)).toBeFalsy();

        const inputNode5 = new InputNode("Sprite1", "Y-Position");
        inputNode5.uID = 2;
        expect(inputNode5.equals(inputNode)).toBeFalsy();

        const biasNode = new BiasNode();
        biasNode.uID = 1;
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
        inputNode.activationValue = 0;
        const out = inputNode.toString();
        expect(out).toContain(`InputNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}\
, Sprite: Sprite1\
, Feature: X-Position}`)
    })
})
