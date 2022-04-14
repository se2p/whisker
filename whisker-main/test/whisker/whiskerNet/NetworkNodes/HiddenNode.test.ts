import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/NeuroevolutionUtil";


describe("hiddenNode Tests", () => {
    let hiddenNode: NodeGene;

    beforeEach(() => {
        hiddenNode = new HiddenNode(1, ActivationFunction.SIGMOID);
    });

    test("Constructor Test", () => {
        const hiddenNode = new HiddenNode(10, ActivationFunction.SIGMOID);
        expect(hiddenNode.activationFunction).toBe(ActivationFunction.SIGMOID);
        expect(hiddenNode.type).toBe(NodeType.HIDDEN);
        expect(hiddenNode.nodeValue).toBe(0);
        expect(hiddenNode.lastActivationValue).toBe(0);
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
        hiddenNode.lastActivationValue = 2;
        hiddenNode.activatedFlag = true;
        hiddenNode.traversed = true;
        hiddenNode.reset();
        expect(hiddenNode.activationCount).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);
        expect(hiddenNode.nodeValue).toBe(0);
        expect(hiddenNode.lastActivationValue).toBe(0);
        expect(hiddenNode.activatedFlag).toBe(false);
        expect(hiddenNode.traversed).toBe(false);

    });

    test("Equals Test", () => {
        const hiddenNode2 = new HiddenNode(1, ActivationFunction.SIGMOID);
        expect(hiddenNode2.equals(hiddenNode)).toBe(true);

        const hiddenNode3 = new HiddenNode(2, ActivationFunction.SIGMOID);
        expect(hiddenNode3.equals(hiddenNode)).toBe(false);

        const hiddenNode4 = new HiddenNode(1, ActivationFunction.NONE);
        expect(hiddenNode4.equals(hiddenNode)).toBe(false);

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
        hiddenNode.activationCount = 1;
        hiddenNode.activatedFlag = true;
        const sigmoidResult = NeuroevolutionUtil.sigmoid(1, 1);
        expect(hiddenNode.activate()).toBe(sigmoidResult);
        expect(hiddenNode.activationValue).toBe(sigmoidResult);
        hiddenNode.reset();
        expect(hiddenNode.activate()).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);

        const hiddenNode2 = new HiddenNode(2, ActivationFunction.NONE);
        hiddenNode2.nodeValue = 5;
        hiddenNode2.activationCount = 10;
        hiddenNode2.activatedFlag = true;
        expect(hiddenNode2.activate()).toBe(5);
        expect(hiddenNode2.activationValue).toBe(5);
        hiddenNode2.reset();
        expect(hiddenNode2.activate()).toBe(0);
        expect(hiddenNode2.activationValue).toBe(0);
    });

    test("toString Test", () => {
        hiddenNode.activationValue = 0;
        const out = hiddenNode.toString();
        expect(out).toContain(`HiddenNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}`);
    });
});
