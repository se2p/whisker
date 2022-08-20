import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {Randomness} from "../../../../src/whisker/utils/Randomness";

describe("Activation Trace", () => {

    let nodeTraces: NodeGene[][][];
    let activationTrace: ActivationTrace;
    const random = Randomness.getInstance();


    beforeEach(() => {
        nodeTraces = [];
        for (let step = 0; step < 50; step++) {
            const stepTrace: NodeGene[][] = [];
            for (let repetitions = 0; repetitions < 30; repetitions++) {
                const repetitionTrace: NodeGene[] = [];
                for (let numNode = 0; numNode < 15; numNode++) {
                    const iNode = new InputNode(numNode, numNode.toString(), numNode.toString());
                    iNode.activatedFlag = true;
                    iNode.activationValue = random.nextInt(0, 100);
                    repetitionTrace.push(iNode);
                }
                stepTrace.push(repetitionTrace);
            }
            nodeTraces.push(stepTrace);
        }
        activationTrace = new ActivationTrace(nodeTraces[0][0]);
    });

    test("Update AT with new node activations", () => {
        // No AT has been added yet.
        expect(activationTrace.trace.size).toBe(0);

        // Add single AT to step 1
        activationTrace.update(1, nodeTraces[0][0]);
        expect(activationTrace.trace.size).toBe(1);
        expect(activationTrace.trace.get(1).get("I:0-0").length).toBe(1);
        expect(activationTrace.trace.get(1).get("I:1-1").length).toBe(1);
        expect(activationTrace.trace.get(1).size).toBe(nodeTraces[0][0].length);

        // Add several ATs to step 2
        const numTraces = 20;
        for (let i = 0; i < numTraces; i++) {
            activationTrace.update(2, nodeTraces[2][i]);
        }
        expect(activationTrace.trace.size).toBe(2);
        expect(activationTrace.trace.get(2).get("I:0-0").length).toBe(numTraces);
        expect(activationTrace.trace.get(2).get("I:1-1").length).toBe(numTraces);
        expect(activationTrace.trace.get(2).size).toBe(nodeTraces[0][0].length);

        // Add new node to ATs of step 3
        for (const repetition of nodeTraces) {
            for (const nodes of repetition) {
                const id = "New";
                const iNodeActivated = new InputNode(0, id, 'Activated');
                const iNodeDeactivated = new InputNode(1, id, 'Deactivated');
                iNodeActivated.activatedFlag = true;
                nodes.push(iNodeActivated);
                nodes.push(iNodeDeactivated);
            }
        }

        // Add step 3 to the trace.
        for (let i = 0; i < nodeTraces[0].length; i++) {
            activationTrace.update(3, nodeTraces[3][i]);
        }
        expect(activationTrace.trace.size).toBe(3);
        expect(activationTrace.trace.get(1).size).toBeLessThan(activationTrace.trace.get(3).size);
        expect(activationTrace.trace.get(3).get("I:0-0").length).toBe(nodeTraces[0].length);
        expect(activationTrace.trace.get(3).get("I:New-Activated").length).toBe(nodeTraces[0].length);
        expect(activationTrace.trace.get(3).size).toBe(nodeTraces[0][0].length - 1);
    });

    test("Clone", () => {
        for (let step = 0; step < nodeTraces.length; step++) {
            const stepTraces = nodeTraces[step];
            for (const stepTraceRepetition of stepTraces) {
                activationTrace.update(step, stepTraceRepetition);
            }
        }

        const clone = activationTrace.clone();
        expect(clone.trace.size).toBe(activationTrace.trace.size);
        clone.trace.delete(0);
        expect(clone.trace.size).toBe(activationTrace.trace.size - 1);
    });

    test("JSON representation of AT", () => {
        activationTrace.update(0, nodeTraces[0][0]);
        activationTrace.update(0, nodeTraces[0][1]);
        activationTrace.update(3, nodeTraces[0][0]);

        const json = activationTrace.toJSON();
        expect(Object.keys(json).length).toBe(2);
        expect(Object.keys(json[0]).length).toBe(nodeTraces[0][0].length);
        expect(json[0]["I:0-0"].length).toBe(2);
        expect(Object.keys(json[3]).length).toBe(nodeTraces[0][0].length);
        expect(json[3]["I:1-1"].length).toBe(1);
    });
});
