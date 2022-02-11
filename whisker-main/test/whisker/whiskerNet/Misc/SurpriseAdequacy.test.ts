import {ActivationTrace} from "../../../../src/whisker/whiskerNet/Misc/ActivationTrace";
import {NodeGene} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeGene";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {InputNode} from "../../../../src/whisker/whiskerNet/NetworkComponents/InputNode";
import {SurpriseAdequacy} from "../../../../src/whisker/whiskerNet/Misc/SurpriseAdequacy";

describe("Distributions", () => {

    const random = Randomness.getInstance();
    let trainingNodeTrace: NodeGene[][][];
    let trainingTrace: ActivationTrace;

    beforeEach(() => {
        trainingNodeTrace = [];
        for (let step = 0; step < 10; step++) {
            const stepTrace: NodeGene[][] = [];
            for (let repetitions = 0; repetitions < 100; repetitions++) {
                const repetitionTrace: NodeGene[] = [];
                for (let numNode = 0; numNode < 15; numNode++) {
                    const iNode = new InputNode(numNode.toString(), numNode.toString());
                    iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
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
                const iNode = new InputNode(i.toString(), i.toString());
                iNode.activationValue = Math.round(random.nextDoubleMinMax(0.1, 0.2) * 100) / 100;
                stepTrace.push(iNode);
            }
            testNodeTrace.push(stepTrace);
        }
        const testTrace = new ActivationTrace(testNodeTrace[0]);
        for (let step = 0; step < testNodeTrace.length; step++) {
            testTrace.update(step, testNodeTrace[step]);
        }

        const surpriseMap = SurpriseAdequacy.likelihoodBased(trainingTrace, testTrace);
        const noSurprises = [...surpriseMap.values()].every(surpriseBoolean => !surpriseBoolean);
        expect(surpriseMap.size).toBe(testNodeTrace.length);
        expect(noSurprises).toBeTruthy();
    });

    test("Likelihood based Surprise Adequacy; different distribution as test AT; shorter training trace", () => {
        const testNodeTrace: NodeGene[][] = [];
        for (let step = 0; step < 12; step++) {
            const stepTrace: NodeGene[] = [];
            for (let i = 0; i < trainingNodeTrace[0][0].length; i++) {
                const iNode = new InputNode(i.toString(), i.toString());
                iNode.activationValue = Math.round(random.nextDoubleMinMax(0, 1) * 100) / 100;
                stepTrace.push(iNode);
            }
            testNodeTrace.push(stepTrace);
        }
        const testTrace = new ActivationTrace(testNodeTrace[0]);
        for (let step = 0; step < testNodeTrace.length; step++) {
            testTrace.update(step, testNodeTrace[step]);
        }

        const surpriseMap = SurpriseAdequacy.likelihoodBased(trainingTrace, testTrace);
        const noSurprises = [...surpriseMap.values()].every(surpriseBoolean => !surpriseBoolean);
        expect(surpriseMap.size).toBe(trainingNodeTrace.length);
        expect(noSurprises).toBeFalsy();
    });

    test("Likelihood based Surprise Adequacy; equal ATs", () => {
        const testTrace = new ActivationTrace(trainingNodeTrace[0][0]);
        for (let step = 0; step < trainingNodeTrace.length; step++) {
            testTrace.update(step, trainingNodeTrace[step][0]);
        }

        const surpriseMap = SurpriseAdequacy.likelihoodBased(trainingTrace, testTrace);
        expect(surpriseMap.size).toBe(trainingNodeTrace.length);
        const noSurprises = [...surpriseMap.values()].every(surpriseBoolean => !surpriseBoolean);
        expect(surpriseMap.size).toBe(trainingNodeTrace.length);
        expect(noSurprises).toBeTruthy();
    });
});
