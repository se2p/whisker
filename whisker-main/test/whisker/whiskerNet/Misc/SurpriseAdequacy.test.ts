import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {SurpriseAdequacy} from "../../../../src/whisker/whiskerNet/Misc/SurpriseAdequacy";

describe("Surprise Adequacy", () => {

    const random = Randomness.getInstance();
    let trainingNodeTrace: NodeGene[][][];
    let trainingTrace: ActivationTrace;

    beforeEach(() => {
        trainingNodeTrace = [];
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
            trainingNodeTrace.push(stepTrace);
        }

        trainingTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            const stepTraces = trainingNodeTrace[step];
            for (const stepTraceRepetition of stepTraces) {
                trainingTrace.update(step, stepTraceRepetition);
            }
        }
    });

    test("Likelihood based Surprise Adequacy; same distribution as test AT; shorter test trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 8; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < trainingNodeTrace[0][0].length; i++) {
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

        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, testTrace);
        expect(surpriseValue).toBeLessThan(1);
    });

    test("Likelihood based Node Surprise Adequacy; same distribution as test AT; shorter test trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 8; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < trainingNodeTrace[0][0].length; i++) {
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

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
    });

    test("Likelihood based Surprise Adequacy; different distribution as test AT; shorter training trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 12; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < trainingNodeTrace[0][0].length; i++) {
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

        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, testTrace);
        expect(surpriseValue).toBeGreaterThan(5);
    });

    test("Likelihood based Node Surprise Adequacy; different distribution as test AT; shorter training trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 12; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < trainingNodeTrace[0][0].length; i++) {
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

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeGreaterThan(5);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeTruthy();
            }
        }
    });

    test("Likelihood based Surprise Adequacy; equal ATs", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, testTrace);
        expect(surpriseValue).toBeLessThan(1);
    });

    test("Likelihood based Node Surprise Adequacy; equal ATs", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
    });

    test("Likelihood based Surprise Adequacy; equal ATs; too few samples", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const shortStep = 5
        for (const nodeId of trainingTrace.trace.get(shortStep).keys()) {
            trainingTrace.trace.get(shortStep).set(nodeId, [Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100]);
        }

        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, testTrace);
        expect(surpriseValue).toBeLessThan(1);
    });

    test("Likelihood based Node Surprise Adequacy; equal ATs; too few samples", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const shortStep = 5
        for (const nodeId of trainingTrace.trace.get(shortStep).keys()) {
            trainingTrace.trace.get(shortStep).set(nodeId, [Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100]);
        }

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
    });

    test("Likelihood based Surprise Adequacy; mismatching nodes", () => {
        const steps = 3;
        const reps = 5;
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

        const testTrace = new ActivationTrace([])
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

        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, testTrace);
        expect(surpriseValue).toBeLessThan(1);
        expect(trainingTrace.trace.get(0).size).toBe(nodes + 1);
        expect(testTrace.trace.get(0).size).toBe(nodes + 1);
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

        const testTrace = new ActivationTrace([])
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

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
        expect(trainingTrace.trace.get(0).size).toBe(nodes + 1);
        expect(testTrace.trace.get(0).size).toBe(nodes + 1);
    });

    test("Likelihood based Surprise Adequacy; missing test trace", () => {
        const surpriseValue = SurpriseAdequacy.LSA(trainingTrace, null)
        expect(surpriseValue).toBe(100);
    });

    test("Likelihood based Node Surprise Adequacy; missing test trace", () => {
        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, null)
        expect(sa[0]).toBe(100);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeTruthy();
            }
        }
    });

    test("Likelihood based Node Surprise Adequacy; equal values in ATs", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const step = 5;
        const id = "I:0-0";
        const values = Array.from({length: 30}).map(x => 0.3);

        trainingTrace.trace.get(step).set(id, values);
        testTrace.trace.get(step).set(id, [values[0]])

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
    });

    test("Likelihood based Node Surprise Adequacy; low std in ATs", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const step = 5;
        const id = "I:0-0";
        const values = Array.from({length: 30}).map(x => 0.3);
        values[0] = 0.299999

        trainingTrace.trace.get(step).set(id, values);
        testTrace.trace.get(step).set(id, [values[1]])

        const sa = SurpriseAdequacy.LSANodeBased(trainingTrace, testTrace);
        expect(sa[0]).toBeLessThan(1);
        for (const surpriseMap of sa[1].values()) {
            for (const surprise of surpriseMap.values()) {
                expect(surprise).toBeFalsy();
            }
        }
    });
});
