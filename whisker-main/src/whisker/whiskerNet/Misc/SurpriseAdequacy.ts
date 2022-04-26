import {ActivationTrace} from "./ActivationTrace";
import Statistics from "../../utils/Statistics";
import Arrays from "../../utils/Arrays";
import {matrix} from "mathjs";
import {Randomness} from "../../utils/Randomness";

export class SurpriseAdequacy {

    public static LSA(trainingTraces: ActivationTrace, testTraces: ActivationTrace): number {
        // The game could not be started, so we penalize with a SA value of 100;
        if (!testTraces) {
            return 100;
        }

        const training = trainingTraces.clone();
        const test = testTraces.clone();
        let surpriseAdequacy = 0;
        let stepCount = 0;
        // Go through each step and calculate the LSA.
        for (const step of test.trace.keys()) {

            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(step)) {
                return surpriseAdequacy / stepCount;
            }

            const trainingTrace = training.trace.get(step);
            const testTrace = test.trace.get(step);

            for (const nodeId of trainingTrace.keys()) {
                if (!testTrace.has(nodeId)) {
                    trainingTrace.delete(nodeId);
                }
            }

            for (const nodeId of testTrace.keys()) {
                if (!trainingTrace.has(nodeId)) {
                    testTrace.delete(nodeId);
                }
            }

            // Extract both traces for the given step and make sure both represent the same number of activations.
            const testStepTrace = test.getStepTrace(step);
            const trainingStepTraces = training.getStepTrace(step).filter(
                trace => trace.length == testStepTrace[0].length);

            if (trainingStepTraces.length < 5) {
                return stepCount > 0 ? surpriseAdequacy / stepCount : undefined;
            }

            // Calculate Surprise Adequacy.
            surpriseAdequacy += this.calculateLSA(trainingStepTraces, testStepTrace[0]);
            stepCount++;
        }
        return surpriseAdequacy / stepCount;
    }

    private static calculateLSA(trainingTraces: number[][], testTrace: number[]) {
        let kdeSum = 0;
        const bandwidth = Statistics.multivariateBandwidthScott(matrix(trainingTraces));

        for (const trainingTrace of trainingTraces) {
            const traceDifference = Arrays.subtract(testTrace, trainingTrace);
            kdeSum += Statistics.multivariateGaussianKernel(traceDifference, bandwidth);
        }

        const density = kdeSum / trainingTraces.length;
        return -Math.log(density);
    }

    public static LSANodeBased(training: ActivationTrace, test: ActivationTrace): [number,Map<number, Map<string, number>>, Map<number, Map<string, boolean>>] {
        const surpriseMap = new Map<number, Map<string, boolean>>();
        const lsaMap = new Map<number, Map<string, number>>();
        let sa = 0;
        let stepCount = 0;
        if (!test) {
            for (const [step, stepTrace] of training.trace.entries()) {
                surpriseMap.set(step, new Map<string, boolean>());
                for (const nodeId of stepTrace.keys()) {
                    surpriseMap.get(step).set(nodeId, true);
                }
            }
            return [100, undefined, undefined];
        }
        // For each step, compare the ATs during training and testing.
        for (const step of test.trace.keys()) {
            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(step)) {
                return [sa / stepCount, lsaMap, surpriseMap];
            }
            surpriseMap.set(step, new Map<string, boolean>());
            lsaMap.set(step, new Map<string, number>());

            for (const [nodeId, nodeTrace] of test.trace.get(step).entries()) {
                const testValue = nodeTrace[0];
                const trainingStepTrace = training.trace.get(step);
                // With too few training samples we cannot reliably detect suspicious behaviour.
                if(!trainingStepTrace){
                    return [sa / stepCount, lsaMap, surpriseMap];
                }

                const trainingNodeTrace = trainingStepTrace.get(nodeId);

                // New node that did not occur in the test generation process, or we observed too few samples.
                if(!trainingNodeTrace || trainingNodeTrace.length < 30){
                    continue;
                }

                const LSA = this.calculateLSANodeBased(trainingNodeTrace, testValue);
                const threshold = this.getLSAThreshold(trainingNodeTrace);
                sa += Math.min(100, LSA);
                lsaMap.get(step).set(nodeId, sa);

                // Check if the test AT for the given step and node is surprising.
                if (LSA > threshold) {
                    console.log(`Suspicious at step ${step} with node ${nodeId} and a value of ${LSA} vs Threshold ${threshold}`);
                    surpriseMap.get(step).set(nodeId, true);
                } else {
                    surpriseMap.get(step).set(nodeId, false);
                }
            }
            stepCount++;
        }
        return [sa /stepCount, lsaMap, surpriseMap];
    }

    private static getLSAThreshold(traceValues: number[]): number {
        if (traceValues.every(value => value == traceValues[0])) {
            return 1;
        }

        let lsa = 0;
        const repetitions = 20;
        const random = Randomness.getInstance();
        for (let i = 0; i < repetitions; i++) {
            const value = random.pick(traceValues);
            lsa += this.calculateLSANodeBased(traceValues, value);
        }
        return Math.max(10, (lsa / repetitions) * 2);
    }

    private static calculateLSANodeBased(trainingTrace: number[], testTrace: number) {
        let kdeSum = 0;
        const bandwidth = Statistics.bandwidthSilverman(trainingTrace);

        if (trainingTrace.every(value => value == testTrace)) {
            return 0;
        }

        const std = Statistics.std(trainingTrace);
        if (std < 0.0001) {
            return Math.abs(trainingTrace[0] - testTrace) * 10;
        }

        for (const trainingValue of trainingTrace) {
            const traceDifference = testTrace - trainingValue;
            kdeSum += Statistics.gaussianKernel(traceDifference / bandwidth);
        }

        const density = kdeSum / (trainingTrace.length * bandwidth);
        return -Math.log(density);
    }


    public static zScore(training: ActivationTrace, test:ActivationTrace): [number, Map<number, Map<string, boolean>>]{
        const surpriseMap = new Map<number, Map<string, boolean>>();
        let zScore = 0;
        let stepCount = 0;
        if (!test) {
            for (const [step, stepTrace] of training.trace.entries()) {
                surpriseMap.set(step, new Map<string, boolean>());
                for (const nodeId of stepTrace.keys()) {
                    surpriseMap.get(step).set(nodeId, true);
                }
            }
            return [5, surpriseMap];
        }
        // For each step, compare the ATs during training and testing.
        for (const step of test.trace.keys()) {
            stepCount++;
            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(step)) {
                return [zScore / stepCount, surpriseMap];
            }
            surpriseMap.set(step, new Map<string, boolean>());

            for (const [nodeId, nodeTrace] of test.trace.get(step).entries()) {
                const testValue = nodeTrace[0];

                // Continue if the training run did not record any activations on a given input.
                if (!training.trace.get(step).has(nodeId)) {
                    continue;
                }
                const trainingValues = training.trace.get(step).get(nodeId);

                // If we have too few values to check against we cannot make a valid prediction and stop since we
                // won't get more values in the future.
                if (trainingValues.length < 20) {
                    return [zScore / stepCount, surpriseMap];
                }

                // Define the threshold for a surprising activation and the surprise value itself.
                const z = this.calculateZScore(trainingValues, testValue);
                zScore += z;

                // Determine if we found a surprising activation, which is the case if the LSA is bigger than 0,
                // bigger than the threshold and if we have an activation value that is not present in the reference
                // trace.
                if (zScore > 3 && !trainingValues.includes(testValue)) {
                    surpriseMap.get(step).set(nodeId, true);
                } else {
                    surpriseMap.get(step).set(nodeId, false);
                }
            }
        }
        return [zScore / stepCount, surpriseMap];
    }

    private static calculateZScore(referenceTrace: number[], testValue: number): number{
        const mean = Statistics.mean(referenceTrace);
        const std = Statistics.std(referenceTrace);
        if(std < 0.001 && mean != testValue){
            return Math.abs(testValue - mean) * 4;
        }
        else if(std < 0.001 && mean == testValue){
            return 0;
        }
        else{
            return Math.abs((testValue - mean) / std);
        }
    }
}
