import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {NetworkAnalysis} from "../../../../src/whisker/whiskerNet/Misc/NetworkAnalysis";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import {expect} from "@jest/globals";

describe("Surprise Adequacy", () => {

    const random = Randomness.getInstance();
    let referenceNodeTrace: NodeGene[][][];
    let referenceTrace: ActivationTrace;
    let network: NeatChromosome;

    beforeEach(() => {
        referenceNodeTrace = [];
        for (let step = 0; step < 10; step++) {
            const stepTrace: NodeGene[][] = [];
            for (let repetitions = 0; repetitions < 30; repetitions++) {
                const repetitionTrace: NodeGene[] = [];
                for (let numNode = 0; numNode < 15; numNode++) {
                    const iNode = new InputNode(numNode, numNode.toString(), numNode.toString());
                    iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                    iNode.activatedFlag = true;
                    repetitionTrace.push(iNode);
                }
                stepTrace.push(repetitionTrace);
            }
            referenceNodeTrace.push(stepTrace);
        }

        referenceTrace = new ActivationTrace(referenceNodeTrace[0][0]);
        for (let step = 0; step < referenceNodeTrace.length; step++) {
            const stepTraces = referenceNodeTrace[step];
            for (const stepTraceRepetition of stepTraces) {
                referenceTrace.update(step, stepTraceRepetition);
            }
        }

        const genInputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        genInputs.set("Sprite1", sprite1);

        const sprite2 = new Map<string, number>();
        sprite2.set("X-Position", 6);
        sprite2.set("Y-Position", 7);
        genInputs.set("Sprite2", sprite2);

        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        const generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, undefined, undefined);
        network = generator.get();
    });

    test("Likelihood based Node Surprise Adequacy; same distribution as test AT; shorter test trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 8; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < referenceNodeTrace[0][0].length; i++) {
                const iNode = new InputNode(i, i.toString(), i.toString());
                iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                iNode.activatedFlag = true;
                stepTrace.push(iNode);
            }
            testNodeTrace.push(stepTrace);
        }
        const testTrace = new ActivationTrace(testNodeTrace[0]);
        for (let step = 0; step < testNodeTrace.length; step++) {
            testTrace.update(step, testNodeTrace[step]);
        }

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
    });

    test("Likelihood based Node Surprise Adequacy; different distribution as test AT; shorter training trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 12; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < referenceNodeTrace[0][0].length; i++) {
                const iNode = new InputNode(i, i.toString(), i.toString());
                iNode.activationValue = Math.round(random.nextDoubleMinMax(0.5, 1) * 100) / 100;
                iNode.activatedFlag = true;
                stepTrace.push(iNode);
            }
            testNodeTrace.push(stepTrace);
        }
        const testTrace = new ActivationTrace(testNodeTrace[0]);
        for (let step = 0; step < testNodeTrace.length; step++) {
            testTrace.update(step, testNodeTrace[step]);
        }

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeGreaterThan(5);
        expect(network.surpriseCount).toBeGreaterThan(1);
    });

    test("Likelihood based Node Surprise Adequacy; equal ATs", () => {
        const testTrace = new ActivationTrace(referenceNodeTrace[0][0]);
        for (let step = 0; step < referenceNodeTrace.length; step++) {
            testTrace.update(step, referenceNodeTrace[step][0]);
        }

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
    });

    test("Likelihood based Node Surprise Adequacy; equal ATs; too few samples", () => {
        const testTrace = new ActivationTrace(referenceNodeTrace[0][0]);
        for (let step = 0; step < referenceNodeTrace.length; step++) {
            testTrace.update(step, referenceNodeTrace[step][0]);
        }

        const shortStep = 5;
        for (const nodeId of referenceTrace.trace.get(shortStep).keys()) {
            referenceTrace.trace.get(shortStep).set(nodeId, [Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100]);
        }

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
    });

    test("Likelihood based Node Surprise Adequacy; mismatching nodes", () => {
        const steps = 3;
        const reps = 30;
        const nodes = 10;
        const trainingTrace = new ActivationTrace([]);
        for (let step = 0; step < steps; step++) {
            for (let repetitions = 0; repetitions < reps; repetitions++) {
                const repetitionTrace: NodeGene[] = [];
                for (let numNode = 0; numNode < nodes; numNode++) {
                    const iNode = new InputNode(numNode, numNode.toString(), numNode.toString());
                    iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                    iNode.activatedFlag = true;
                    repetitionTrace.push(iNode);
                }
                const newINode = new InputNode(nodes + 1, "Training", "New");
                newINode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                newINode.activatedFlag = true;
                repetitionTrace.push(newINode);
                trainingTrace.update(step, repetitionTrace);
            }
        }

        const testTrace = new ActivationTrace([]);
        for (let step = 0; step < steps; step++) {
            const nodeTrace: NodeGene[] = [];
            for (let numNode = 0; numNode < nodes; numNode++) {
                const iNode = new InputNode(numNode, numNode.toString(), numNode.toString());
                iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                iNode.activatedFlag = true;
                nodeTrace.push(iNode);
            }
            const newINode = new InputNode(nodes + 2, "Test", "New");
            newINode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
            newINode.activatedFlag = true;
            nodeTrace.push(newINode);
            testTrace.update(step, nodeTrace);
        }

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
        expect(trainingTrace.trace.get(0).size).toBe(nodes + 1);
        expect(testTrace.trace.get(0).size).toBe(nodes + 1);
    });

    test("Likelihood based Node Surprise Adequacy; missing test trace", () => {
        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = null;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBe(100);
        expect(network.surpriseCount).toBe(referenceTrace.tracedNodes.length);
    });

    test("Likelihood based Node Surprise Adequacy; equal values in ATs", () => {
        const testTrace = new ActivationTrace(referenceNodeTrace[0][0]);
        for (let step = 0; step < referenceNodeTrace.length; step++) {
            testTrace.update(step, referenceNodeTrace[step][0]);
        }

        const step = 5;
        const id = "I:0-0";
        const values = Array.from({length: 30}).map(x => 0.3);

        referenceTrace.trace.get(step).set(id, values);
        testTrace.trace.get(step).set(id, [values[0]]);

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
    });

    test("Likelihood based Node Surprise Adequacy; low std in ATs", () => {
        const testTrace = new ActivationTrace(referenceNodeTrace[0][0]);
        for (let step = 0; step < referenceNodeTrace.length; step++) {
            testTrace.update(step, referenceNodeTrace[step][0]);
        }

        const step = 5;
        const id = "I:0-0";
        const values = Array.from({length: 30}).map(x => 0.3);
        values[0] = 0.299999;

        referenceTrace.trace.get(step).set(id, values);
        testTrace.trace.get(step).set(id, [values[1]]);

        network.referenceActivationTrace = referenceTrace;
        network.testActivationTrace = testTrace;

        NetworkAnalysis.analyseNetwork(network);
        expect(network.averageNodeBasedLSA).toBeLessThan(1);
        expect(network.surpriseCount).toEqual(0);
    });
});
