import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/NeuroevolutionUtil";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {ClickStageEvent} from "../../../../src/whisker/testcase/events/ClickStageEvent";


describe("classificationNode Tests", () => {
    let classificationNode: NodeGene;

    beforeEach(() => {
        classificationNode = new ClassificationNode(1, new WaitEvent(), ActivationFunction.SIGMOID);
    });

    test("Constructor Test", () => {
        const classificationNode = new ClassificationNode(10, new WaitEvent(), ActivationFunction.SIGMOID);
        expect(classificationNode.uID).toBe(10);
        expect(classificationNode.activationFunction).toBe(ActivationFunction.SIGMOID);
        expect(classificationNode.type).toBe(NodeType.OUTPUT);
        expect(classificationNode.nodeValue).toBe(0);
        expect(classificationNode.lastActivationValue).toBe(0);
        expect(classificationNode.activationValue).toBe(0);
        expect(classificationNode.activatedFlag).toBeFalsy();
        expect(classificationNode.activationCount).toBe(0);
        expect(classificationNode.traversed).toBeFalsy();
        expect(classificationNode.incomingConnections.length).toBe(0);
        expect(classificationNode.event instanceof WaitEvent).toBeTruthy();
    });

    test("Reset Node", () => {
        classificationNode.activationCount = 10;
        classificationNode.activationValue = 2;
        classificationNode.nodeValue = 10;
        classificationNode.lastActivationValue = 2;
        classificationNode.activatedFlag = true;
        classificationNode.traversed = true;
        classificationNode.reset();
        expect(classificationNode.activationCount).toBe(0);
        expect(classificationNode.activationValue).toBe(0);
        expect(classificationNode.nodeValue).toBe(0);
        expect(classificationNode.lastActivationValue).toBe(0);
        expect(classificationNode.activatedFlag).toBeFalsy();
        expect(classificationNode.traversed).toBeFalsy();

    });

    test("Equals Test", () => {
        const classificationNode2 = new ClassificationNode(1, new WaitEvent, ActivationFunction.SIGMOID);
        expect(classificationNode2.equals(classificationNode)).toBeTruthy();

        const classificationNode3 = new ClassificationNode(2, new WaitEvent, ActivationFunction.SIGMOID);
        expect(classificationNode3.equals(classificationNode)).toBeTruthy();

        const classificationNode4 = new ClassificationNode(1, new ClickStageEvent(), ActivationFunction.SIGMOID);
        expect(classificationNode4.equals(classificationNode)).toBeFalsy();

        const classificationNode5 = new ClassificationNode(1, new WaitEvent, ActivationFunction.NONE);
        expect(classificationNode5.equals(classificationNode)).toBeFalsy();

        const biasNode = new BiasNode(1);
        expect(biasNode.equals(classificationNode)).toBe(false);
    });

    test("Clone Test", () => {
        const clone = classificationNode.clone();
        expect(clone.uID).toBe(classificationNode.uID);
        expect(clone.equals(classificationNode)).toBe(true);
        expect(clone === classificationNode).toBe(false);
    });

    test("getActivationValue Test", () => {
        classificationNode.nodeValue = 1;
        classificationNode.activatedFlag = true;
        const sigmoidResult = NeuroevolutionUtil.sigmoid(1, 1);
        expect(classificationNode.activate()).toBe(sigmoidResult);
        expect(classificationNode.activationValue).toBe(sigmoidResult);
        classificationNode.reset();
        expect(classificationNode.activate()).toBe(0);
        expect(classificationNode.activationValue).toBe(0);

        const classificationNode2 = new ClassificationNode(2, new WaitEvent(), ActivationFunction.NONE);
        classificationNode2.nodeValue = 5;
        classificationNode2.activationCount = 10;
        classificationNode2.activatedFlag = true;
        expect(classificationNode2.activate()).toBe(5);
        expect(classificationNode2.activationValue).toBe(5);
        classificationNode2.reset();
        expect(classificationNode2.activate()).toBe(0);
        expect(classificationNode2.activationValue).toBe(0);
    });

    test("toString Test", () => {
        classificationNode.activationValue = 0;
        const out = classificationNode.toString();
        expect(out).toContain(
            `ClassificationNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}`);
    });
});
