import {HiddenNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/HiddenNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/NeuroevolutionUtil";


describe("hiddenNode Tests", () => {
    let hiddenNode: NodeGene

    beforeEach(() => {
        hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 1;
    })

    test("Constructor Test", () => {

        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode.uID = 10;

        expect(hiddenNode.uID).toBe(10);
        expect(hiddenNode.activationFunction).toBe(ActivationFunction.SIGMOID);
        expect(hiddenNode.type).toBe(NodeType.HIDDEN);
        expect(hiddenNode.nodeValue).toBe(0);
        expect(hiddenNode.lastActivationValue).toBe(0);
        expect(hiddenNode.activationValue).toBe(undefined)
        expect(hiddenNode.activatedFlag).toBe(false)
        expect(hiddenNode.activationCount).toBe(0);
        expect(hiddenNode.traversed).toBe(false)
        expect(hiddenNode.incomingConnections.length).toBe(0);
    })

    test("Reset Node", () => {
        hiddenNode.activationCount = 10;
        hiddenNode.activationValue = 2;
        hiddenNode.nodeValue = 10;
        hiddenNode.lastActivationValue = 2;
        hiddenNode.activatedFlag = true;
        hiddenNode.traversed = true;
        hiddenNode.reset();
        expect(hiddenNode.activationCount).toBe(0)
        expect(hiddenNode.activationValue).toBe(0)
        expect(hiddenNode.nodeValue).toBe(0)
        expect(hiddenNode.lastActivationValue).toBe(0)
        expect(hiddenNode.activatedFlag).toBe(false)
        expect(hiddenNode.traversed).toBe(false)

    })

    test("Equals Test", () => {
        const hiddenNode2 = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode2.uID = 1;
        expect(hiddenNode2.equals(hiddenNode)).toBe(true);

        const hiddenNode3 = new HiddenNode(ActivationFunction.SIGMOID);
        hiddenNode3.uID = 2;
        expect(hiddenNode3.equals(hiddenNode)).toBe(false);

        const hiddenNode4 = new HiddenNode(ActivationFunction.NONE);
        hiddenNode4.uID = 1;
        expect(hiddenNode4.equals(hiddenNode)).toBe(false);

        const biasNode = new BiasNode();
        biasNode.uID = 1;
        expect(biasNode.equals(hiddenNode)).toBe(false);
    })

    test("Clone Test", () => {
        const clone = hiddenNode.clone();
        expect(clone.uID).toBe(hiddenNode.uID);
        expect(clone.equals(hiddenNode)).toBe(true);
        expect(clone === hiddenNode).toBe(false);
    })

    test("getActivationValue Test", () => {
        hiddenNode.nodeValue = 10;
        hiddenNode.activationCount = 1;
        const sigmoidResult = NeuroevolutionUtil.sigmoid(10, -4.9);
        expect(hiddenNode.activate()).toBe(sigmoidResult);
        expect(hiddenNode.activationValue).toBe(sigmoidResult)
        hiddenNode.reset()
        expect(hiddenNode.activate()).toBe(0);
        expect(hiddenNode.activationValue).toBe(0);

        const hiddenNode2 = new HiddenNode(ActivationFunction.NONE);
        hiddenNode2.uID = 2;
        hiddenNode2.nodeValue = 5;
        hiddenNode2.activationCount = 10;
        expect(hiddenNode2.activate()).toBe(5);
        expect(hiddenNode2.activationValue).toBe(5)
        hiddenNode2.reset()
        expect(hiddenNode2.activate()).toBe(0);
        expect(hiddenNode2.activationValue).toBe(0);
    })

    test("toString Test", () => {
        hiddenNode.activationValue = 0;
        const out = hiddenNode.toString();
        expect(out).toContain(`HiddenNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}`)
    })
})
