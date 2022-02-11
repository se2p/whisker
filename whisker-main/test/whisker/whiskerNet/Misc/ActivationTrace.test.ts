import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {Randomness} from "../../../../src/whisker/utils/Randomness";

describe("Distributions", () => {

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
                    const iNode = new InputNode(numNode.toString(), numNode.toString());
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
        expect(activationTrace.trace.get(1).length).toBe(1);
        expect(activationTrace.trace.get(1)[0].length).toBe(nodeTraces[0][0].length);

        // Add several ATs to step 2
        const numTraces = 20
        for (let i = 0; i < numTraces; i++) {
            activationTrace.update(2, nodeTraces[2][i]);
        }
        expect(activationTrace.trace.size).toBe(2);
        expect(activationTrace.trace.get(2).length).toBe(numTraces);
        expect(activationTrace.trace.get(2)[0].length).toBe(nodeTraces[0][0].length);
    });

    test("Group AT by Nodes", () =>{
        for (let step = 0; step < nodeTraces.length; step++) {
            const stepTraces = nodeTraces[step];
            for(const stepTraceRepetition of stepTraces){
                activationTrace.update(step, stepTraceRepetition);
            }
        }

        const nodeActivationTraces = activationTrace.groupByNodes();
        expect(nodeActivationTraces.size).toBe(nodeTraces.length);
        expect(nodeActivationTraces.get(0).size).toBe(nodeTraces[0][0].length);
        expect(nodeActivationTraces.get(0).get("I:0-0").length).toBe(nodeTraces[0].length);
        expect(nodeActivationTraces.get(0).get("I:0-0")[0]).toBe(activationTrace.trace.get(0)[0][0])
    });

    test("JSON representation of AT", () =>{
        activationTrace.update(0, nodeTraces[0][0]);
        activationTrace.update(0, nodeTraces[0][1]);
        activationTrace.update(3, nodeTraces[0][0]);

        const json = activationTrace.toJSON();
        expect(Object.keys(json).length).toBe(2);
        expect(json[0].length).toBe(2);
        expect(json[0][0].length).toBe(nodeTraces[0][0].length);
        expect(json[3].length).toBe(1);
        expect(json[3][0].length).toBe(nodeTraces[0][0].length);
    });
});
