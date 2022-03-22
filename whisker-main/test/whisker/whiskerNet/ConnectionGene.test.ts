import {ConnectionGene} from "../../../src/whisker/whiskerNet/NetworkComponents/ConnectionGene";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkComponents/ClassificationNode";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";

describe("ConnectionGene Test", () => {

    let connection: ConnectionGene;
    let sourceNode: NodeGene;
    let targetNode: NodeGene;

    beforeEach(() => {
        sourceNode = new InputNode("Sprite1", "X-Position");
        sourceNode.uID = 0;
        targetNode = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        targetNode.uID = 1;
        connection = new ConnectionGene(sourceNode, targetNode, 0.2, true, ConnectionGene.getNextInnovationNumber(), false);
    });

    test("Test Constructor", () => {
        expect(connection.source).toBe(sourceNode);
        expect(connection.target).toBe(targetNode);
        expect(connection.weight).toBe(0.2);
        expect(connection.isEnabled).toBe(true);
        expect(connection.innovation).toBe(1);
        expect(connection.isRecurrent).toBe(false);
        expect(ConnectionGene.getNextInnovationNumber()).toBe(2);
    });

    test("Test getter and setter", () => {
        connection.weight = 1;
        connection.isEnabled = false;
        connection.innovation = 30;

        expect(connection.weight).toBe(1);
        expect(connection.isEnabled).toBe(false);
        expect(connection.innovation).toBe(30);
    });

    test("Test cloneWithNodes", () => {
        const inNode = new InputNode("Sprite1", "Y-Position");
        inNode.uID = 2;
        const outNode = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        outNode.uID = 3;
        const cloneConnection = connection.cloneWithNodes(inNode, outNode);

        expect(connection.source).not.toBe(cloneConnection.source);
        expect(connection.target).not.toBe(cloneConnection.target);
        expect(connection.weight).toBe(cloneConnection.weight);
        expect(connection.isEnabled).toBe(cloneConnection.isEnabled);
        expect(connection.innovation).toBe(cloneConnection.innovation);
        expect(connection.isRecurrent).toBe(cloneConnection.isRecurrent);
    });

    test("Test equalsByNodes with equal nodes", () => {
        const inNode = new InputNode("Sprite1", "X-Position");
        inNode.uID = 1;
        const outNode = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        outNode.uID = 2;

        const otherConnection = new ConnectionGene(inNode, outNode, 0.2, true, 1, false);
        expect(connection.equalsByNodes(otherConnection)).toBe(true);
    });

    test("Test equalsByNodes with differing nodes", () => {
        const inNode = new InputNode("Sprite2", "X-Position");
        inNode.uID = 2;
        const outNode = new ClassificationNode(new WaitEvent(), ActivationFunction.SIGMOID);
        outNode.uID = 3;

        const otherConnection = new ConnectionGene(inNode, outNode, 0.2, true, 1, false);
        expect(connection.equalsByNodes(otherConnection)).toBe(false);
    });

    test("Test equalsByNodes with differing classes", () => {
        expect(connection.equalsByNodes(sourceNode)).toBe(false);
    });

    test("Test toString", () => {
        const expected = `ConnectionGene{FromId: 0\
, ToId: 1\
, Weight: 0.2\
, Enabled: true\
, Recurrent: false\
, InnovationNumber: ${(ConnectionGene.getNextInnovationNumber() - 1)}}`;
        expect(connection.toString()).toContain(expected);
    });
});
