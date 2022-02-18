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

    private static calculateLSAThreshold(trainingTrace: ActivationTrace, thresholdFactor: number): Map<number, number> {
        const thresholdMap = new Map<number, number>();
        const random = Randomness.getInstance();
        const trainingStepTrace = trainingTrace.groupBySteps();
        for (const step of trainingStepTrace.keys()) {
            const stepTrace = trainingStepTrace.get(step);

            if (stepTrace.length < 10) {
                return thresholdMap;
            }

            let LSA = 0;
            const repetitions = 5;
            for (let i = 0; i < repetitions; i++) {
                const randomIndex = random.nextInt(0, stepTrace.length);
                const randomSample = stepTrace[randomIndex];
                LSA += this.calculateLSA(stepTrace, randomSample);
            }
            LSA /= repetitions;
            LSA = LSA < 0 ? LSA / thresholdFactor : LSA * thresholdFactor;
            thresholdMap.set(step, LSA);
        }
        return thresholdMap;
    }

    public static likelihoodNodeBased(training: ActivationTrace, test: ActivationTrace): Map<number, Map<string, boolean>> {
        // For each step, compare the ATs during training and testing.
        const surpriseMap = new Map<number, Map<string, boolean>>();
        for (const step of test.trace.keys()) {
            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(step)) {
                return surpriseMap;
            }
            surpriseMap.set(step, new Map<string, boolean>());

            for (const [nodeId, nodeTrace] of test.trace.get(step).entries()) {
                const testValue = nodeTrace[0];
                const trainingValues = training.trace.get(step).get(nodeId);
                const LSA = this.calculateLSANodeBased(trainingValues, testValue);

                // Check if the test AT for the given step and node is surprising.
                if (LSA > 2.5) {
                    surpriseMap.get(step).set(nodeId, true);
                } else {
                    surpriseMap.get(step).set(nodeId, false);
                }
            }
        }
        return surpriseMap;
    }

    private static calculateLSANodeBased(trainingTrace: number[], testTrace: number) {
        let kdeSum = 0;
        const bandwidth = Statistics.bandwidthSilverman(trainingTrace);

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
