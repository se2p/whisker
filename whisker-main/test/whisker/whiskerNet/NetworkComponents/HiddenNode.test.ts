import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/Misc/NeuroevolutionUtil";


describe("hiddenNode Tests", () => {
    let hiddenNode: NodeGene;

    beforeEach(() => {
        hiddenNode = new HiddenNode(1, 0.5, ActivationFunction.SIGMOID);
    });

    test("Constructor Test", () => {
        const hiddenNode = new HiddenNode(10, 0.5,ActivationFunction.SIGMOID);
        expect(hiddenNode.depth).toEqual(0.5);
        expect(hiddenNode.activationFunction).toBe(ActivationFunction.SIGMOID);
        expect(hiddenNode.type).toBe(NodeType.HIDDEN);
        expect(hiddenNode.nodeValue).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);
        expect(hiddenNode.activatedFlag).toBe(false);
        expect(hiddenNode.activationCount).toBe(0);
        expect(hiddenNode.traversed).toBe(false);
        expect(hiddenNode.incomingConnections.length).toBe(0);
    });

    test("Reset Node", () => {
        hiddenNode.activationCount = 10;
        hiddenNode.activationValue = 2;
        hiddenNode.nodeValue = 10;
        hiddenNode.activatedFlag = true;
        hiddenNode.traversed = true;
        hiddenNode.reset();
        expect(hiddenNode.activationCount).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);
        expect(hiddenNode.nodeValue).toBe(0);
        expect(hiddenNode.activatedFlag).toBe(false);
        expect(hiddenNode.traversed).toBe(false);

    });

    test("Equals Test", () => {
        const hiddenNode2 = new HiddenNode(1, 0.5, ActivationFunction.SIGMOID);
        expect(hiddenNode2.equals(hiddenNode)).toBe(true);

        const hiddenNode3 = new HiddenNode(2, 0.5, ActivationFunction.SIGMOID);
        expect(hiddenNode3.equals(hiddenNode)).toBe(false);

        const biasNode = new BiasNode(1);
        expect(biasNode.equals(hiddenNode)).toBe(false);
    });

    test("Clone Test", () => {
        const clone = hiddenNode.clone();
        expect(clone.uID).toBe(hiddenNode.uID);
        expect(clone.equals(hiddenNode)).toBe(true);
        expect(clone === hiddenNode).toBe(false);
    });

    test("getActivationValue Test", () => {
        hiddenNode.nodeValue = 1;
        hiddenNode.activatedFlag = true;
        const sigmoidResult = NeuroevolutionUtil.sigmoid(1, 1);
        expect(hiddenNode.activate()).toBe(sigmoidResult);
        expect(hiddenNode.activationValue).toBe(sigmoidResult);
        hiddenNode.reset();
        expect(hiddenNode.activate()).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);

        const hiddenNode2 = new HiddenNode(2, 0.5, ActivationFunction.NONE);
        hiddenNode2.nodeValue = 5;
        hiddenNode2.activatedFlag = true;
        expect(hiddenNode2.activate()).toBe(5);
        expect(hiddenNode2.activationValue).toBe(5);
        hiddenNode2.reset();
        expect(hiddenNode2.activate()).toBe(0);
        expect(hiddenNode2.activationValue).toBe(0);

        const hiddenNode3 = new HiddenNode(2, 0.5, ActivationFunction.TANH);
        hiddenNode3.nodeValue = -1;
        hiddenNode3.activatedFlag = true;
        const tanhResult = Math.tanh(-1);
        expect(hiddenNode3.activate()).toBe(tanhResult);
        expect(hiddenNode3.activationValue).toBe(tanhResult);
        hiddenNode3.reset();
        expect(hiddenNode3.activate()).toBe(0);
        expect(hiddenNode3.activationValue).toBe(0);
    });

    test("Identifier", () =>{
        expect(hiddenNode.identifier()).toBe(`H:${hiddenNode.uID}`);
    });

    test("toString Test", () => {
        hiddenNode.activationValue = 0;
        const out = hiddenNode.toString();
        expect(out).toContain(`HiddenNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}`);
    });

    test("toJSON", () => {
        const json = hiddenNode.toJSON();
        const expected = {
            't': "H",
            'id' : hiddenNode.uID,
            'aF' : "SIGMOID",
            'd': 0.5
        };
        expect(json).toEqual(expected);
    });
});
