import {ClassificationNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
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
        classificationNode.activatedFlag = true;
        classificationNode.traversed = true;
        classificationNode.reset();
        expect(classificationNode.activationCount).toBe(0);
        expect(classificationNode.activationValue).toBe(0);
        expect(classificationNode.nodeValue).toBe(0);
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

        const biasNode = new BiasNode(1);
        expect(biasNode.equals(classificationNode)).toBe(false);
    });

    test("Clone Test", () => {
        const clone = classificationNode.clone();
        expect(clone.uID).toBe(classificationNode.uID);
        expect(clone.equals(classificationNode)).toBe(true);
        expect(clone === classificationNode).toBe(false);
    });

    test("Identifier", () =>{
        expect(classificationNode.identifier()).toBe("C:WaitEvent");
    });

    test("toString Test", () => {
        classificationNode.activationValue = 0;
        const out = classificationNode.toString();
        expect(out).toContain(
            `ClassificationNode{ID: 1\
, Value: 0\
, InputConnections: ${[]}`);
    });

    test("toJSON", () => {
        const json = classificationNode.toJSON();
        const expected = {
            't': "C",
            'id' : classificationNode.uID,
            'aF' : "SIGMOID",
            'event' : "WaitEvent",
            'd': 1
        };
        expect(json).toEqual(expected);
    });
});
