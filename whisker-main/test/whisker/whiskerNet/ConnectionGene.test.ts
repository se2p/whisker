import {ConnectionGene} from "../../../src/whisker/whiskerNet/ConnectionGene";
import {InputNode} from "../../../src/whisker/whiskerNet/NetworkNodes/InputNode";
import {ClassificationNode} from "../../../src/whisker/whiskerNet/NetworkNodes/ClassificationNode";
import {ActivationFunction} from "../../../src/whisker/whiskerNet/NetworkNodes/ActivationFunction";
import {NodeGene} from "../../../src/whisker/whiskerNet/NetworkNodes/NodeGene";

describe("ConnectionGene Test", () =>{

    let connection : ConnectionGene;
    let sourceNode: NodeGene;
    let targetNode: NodeGene;


    beforeEach(() =>{
        sourceNode = new InputNode(0,0);
        targetNode = new ClassificationNode(1, ActivationFunction.SIGMOID);
        connection = new ConnectionGene(sourceNode, targetNode,0.2,true,ConnectionGene.getNextInnovationNumber(),false);
    })

    test("Test Constructor", () =>{
        expect(connection.source).toBe(sourceNode);
        expect(connection.target).toBe(targetNode);
        expect(connection.weight).toBe(0.2);
        expect(connection.isEnabled).toBe(true);
        expect(connection.innovation).toBe(1)
        expect(connection.recurrent).toBe(false);
        expect(ConnectionGene.getNextInnovationNumber()).toBe(2)
    })

    test("Test getter and setter", () =>{
        connection.weight = 1;
        connection.isEnabled = false;
        connection.innovation = 30;

        expect(connection.weight).toBe(1);
        expect(connection.isEnabled).toBe(false);
        expect(connection.innovation).toBe(30);
    })

    test("Test cloneWithNodes", () =>{
        const inNode = new InputNode(2,0);
        const outNode = new ClassificationNode(3, ActivationFunction.SIGMOID);
        const cloneConnection = connection.cloneWithNodes(inNode, outNode);

        expect(connection.source).not.toBe(cloneConnection.source);
        expect(connection.target).not.toBe(cloneConnection.target);
        expect(connection.weight).toBe(cloneConnection.weight);
        expect(connection.isEnabled).toBe(cloneConnection.isEnabled);
        expect(connection.innovation).toBe(cloneConnection.innovation);
        expect(connection.recurrent).toBe(cloneConnection.recurrent);
    })

    test("Test equalsByNodes with equal nodes", () =>{
        const inNode = new InputNode(1,0);
        const outNode = new ClassificationNode(2, ActivationFunction.SIGMOID);

        const otherConnection = new ConnectionGene(inNode, outNode, 0.2,true,1,false);
        expect(connection.equalsByNodes(otherConnection)).toBe(false)
    })

    test("Test equalsByNodes with differing nodes", () =>{
        const inNode = new InputNode(2,0);
        const outNode = new ClassificationNode(3, ActivationFunction.SIGMOID);

        const otherConnection = new ConnectionGene(inNode, outNode, 0.2,true,1,false);
        expect(connection.equalsByNodes(otherConnection)).toBe(false)
    })

    test("Test equalsByNodes with differing classes", () =>{
        expect(connection.equalsByNodes(sourceNode)).toBe(false)
    })

    test("Test toString", () =>{
        const expected = "ConnectionGene{FromId: " + 0 + ", ToId: " + 1 + ", Weight: " + 0.2 +
            ", Enabled: " + true + ", InnovationNumber: " + (ConnectionGene.getNextInnovationNumber()-1) + "}"
        expect(connection.toString()).toContain(expected)
    })
})
