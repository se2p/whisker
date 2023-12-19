import {RegressionNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/RegressionNode";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";
import {ConnectionGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {BiasNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/BiasNode";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/Misc/NeuroevolutionUtil";


describe("regressionNode Tests", () => {
    let regressionNode: RegressionNode;

    beforeEach(() => {
        regressionNode = new RegressionNode(1, new WaitEvent(), "Duration");
    });

    test("Constructor Test", () => {
        const regressionNode = new RegressionNode(10, new WaitEvent(), "Duration");
        expect(regressionNode.uID).toBe(10);
        expect(regressionNode.activationFunction).toBe(ActivationFunction.SIGMOID);
        expect(regressionNode.type).toBe(NodeType.OUTPUT);
        expect(regressionNode.nodeValue).toBe(0);
        expect(regressionNode.activationValue).toBe(0);
        expect(regressionNode.activatedFlag).toBe(false);
        expect(regressionNode.activationCount).toBe(0);
        expect(regressionNode.traversed).toBe(false);
        expect(regressionNode.incomingConnections.length).toBe(0);
        expect(regressionNode.eventParameter).toEqual("Duration");
    });

    test("Reset Node", () => {
        regressionNode.activationCount = 10;
        regressionNode.activationValue = 2;
        regressionNode.nodeValue = 10;
        regressionNode.activatedFlag = true;
        regressionNode.traversed = true;
        regressionNode.reset();
        expect(regressionNode.activationCount).toBe(0);
        expect(regressionNode.activationValue).toBe(0);
        expect(regressionNode.nodeValue).toBe(0);
        expect(regressionNode.activatedFlag).toBe(false);
        expect(regressionNode.traversed).toBe(false);
    });

    test("Equals Test", () => {
        const regressionNode2 = new RegressionNode(1, new WaitEvent(), "Duration");
        expect(regressionNode2.equals(regressionNode)).toBeTruthy();

        const regressionNode3 = new RegressionNode(2, new WaitEvent(), "Duration");
        expect(regressionNode3.equals(regressionNode)).toBeTruthy();

        const regressionNode4 = new RegressionNode(2, new MouseMoveEvent(0, 0), "Duration");
        expect(regressionNode4.equals(regressionNode)).toBeFalsy();

        const regressionNode5 = new RegressionNode(2, new WaitEvent, "Steps");
        expect(regressionNode5.equals(regressionNode)).toBeFalsy();

        const biasNode = new BiasNode(1);
        expect(regressionNode.equals(biasNode)).toBeFalsy();
    });

    test("Clone Test", () => {
        const clone = regressionNode.clone();
        expect(clone.uID).toEqual(regressionNode.uID);
        expect(clone.eventParameter).toEqual(regressionNode.eventParameter);
        expect(clone.activationFunction).toEqual(regressionNode.activationFunction);
        expect(clone.equals(regressionNode)).toBeTruthy();
        expect(clone === regressionNode).toBeFalsy();
    });

    test("getActivationValue Test", () => {
        regressionNode.nodeValue = 10;
        regressionNode.activationCount = 1;
        regressionNode.activatedFlag = true;
        regressionNode.activationValue = regressionNode.activate();
        expect(regressionNode.activationValue).toBe(NeuroevolutionUtil.sigmoid(10, 1));
        regressionNode.reset();
        expect(regressionNode.activate()).toBe(0);
        expect(regressionNode.activationValue).toBe(0);

        const regressionNode2 = new RegressionNode(2, new WaitEvent(), "Duration");
        regressionNode2.nodeValue = 5;
        regressionNode2.activationCount = 10;
        regressionNode2.activatedFlag = true;
        regressionNode2.activationValue = regressionNode2.activate();
        expect(regressionNode2.activationValue).toBe(NeuroevolutionUtil.sigmoid(5, 1));
        regressionNode2.reset();
        expect(regressionNode2.activate()).toBe(0);
        expect(regressionNode2.activationValue).toBe(0);
    });

    test("Test getEventName", () => {
        expect(regressionNode.event).toBeInstanceOf(WaitEvent);
    });

    test("Identifier", () =>{
        expect(regressionNode.identifier()).toBe("R:WaitEvent-Duration");
    });

    test("toString Test", () => {
        const inputNode = new InputNode(2, "Sprite1", "Position-X");
        const connection = new ConnectionGene(inputNode, regressionNode, 2, true, 1);
        const incomingList: ConnectionGene[] = [];
        incomingList.push(connection);
        regressionNode.incomingConnections = incomingList;
        regressionNode.activationValue = 0;
        const out = regressionNode.toString();
        expect(out).toContain(`RegressionNode{ID: 1\
, Value: 0\
, ActivationFunction: 1\
, InputConnections: ${connection.toString()}\
, Event: WaitEvent\
, Parameter Duration}`);
    });

    test("toJSON", () => {
        const json = regressionNode.toJSON();
        const expected = {
            't': "R",
            'id' : regressionNode.uID,
            'aF' : "SIGMOID",
            'event': "WaitEvent",
            'eventP': "Duration",
            'd': 1
        };
        expect(json).toEqual(expected);
    });
});
