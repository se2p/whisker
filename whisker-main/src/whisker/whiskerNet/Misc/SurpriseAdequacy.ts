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
                return surpriseAdequacy / stepCount;
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

    public static LSANodeBased(training: ActivationTrace, test: ActivationTrace): [number, Map<number, Map<string, boolean>>] {
        const surpriseMap = new Map<number, Map<string, boolean>>();
        let sa = 0;
        let stepCount = 0;
        if (!test) {
            for (const [step, stepTrace] of training.trace.entries()) {
                surpriseMap.set(step, new Map<string, boolean>());
                for (const nodeId of stepTrace.keys()) {
                    surpriseMap.get(step).set(nodeId, true);
                }
            }
            return [100, surpriseMap];
        }
        // For each step, compare the ATs during training and testing.
        for (const step of test.trace.keys()) {
            stepCount++;
            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(step)) {
                return [sa / stepCount, surpriseMap];
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
                    return [sa / stepCount, surpriseMap];
                }

                // Define the threshold for a surprising activation and the surprise value itself.
                const threshold = this.getLSAThreshold(trainingValues);
                const LSA = this.calculateLSANodeBased(trainingValues, testValue);
                sa += Math.min(100, LSA);

                // Determine if we found a surprising activation, which is the case if the LSA is bigger than 0,
                // bigger than the threshold and if we have an activation value that is not present in the reference
                // trace.
                if (LSA > 0 && LSA > threshold && !trainingValues.includes(testValue)) {
                    surpriseMap.get(step).set(nodeId, true);
                } else {
                    surpriseMap.get(step).set(nodeId, false);
                }
            }
        }
        return [sa / stepCount, surpriseMap];
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
        return Math.max(1, lsa / repetitions) * 2;
    }

    private static calculateLSANodeBased(trainingTrace: number[], testTrace: number) {
        let kdeSum = 0;
        const bandwidth = Statistics.bandwidthSilverman(trainingTrace);
        const equal = trainingTrace.every(value => value == testTrace);

        if (equal) {
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

    /*
    public static zScore(reference: ActivationTrace, test:ActivationTrace): Map<string, boolean>{
        const outliers = new Map<string, boolean>();
        for(const [node, trace] of reference.inputTrace.entries()){
            const testValue = test.inputTrace.get(node)[0];
            outliers.set(node, this.predictOutlierZScore(trace, testValue))
        }
        return outliers;
    }

    private static predictOutlierZScore(referenceTrace: number[], testValue: number): boolean{
        // We need enough data points to make a prediction!
        if(referenceTrace.length < 10){
            return undefined
        }

        const [mean, std] = this.meanAndStd(referenceTrace);
        if(std == 0 && mean != testValue){
            return true
        }
        else{
            const zScore = (testValue - mean) / std;
            return Math.abs(zScore) > 3;
        }
    }

     */
}
