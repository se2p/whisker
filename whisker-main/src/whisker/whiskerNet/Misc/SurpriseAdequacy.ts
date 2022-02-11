import {ActivationTrace} from "./ActivationTrace";
import Statistics from "../../utils/Statistics";
import Arrays from "../../utils/Arrays";
import {matrix} from "mathjs";

export class SurpriseAdequacy {

    public static likelihoodBased(training: ActivationTrace, test: ActivationTrace): Map<number, boolean>{
        // For each step, compare the ATs during training and testing.
        const surpriseMap = new Map<number, boolean>();
        for (let i = 0; i < test.trace.size; i++) {

            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!training.trace.has(i)){
                return surpriseMap;
            }

            const trainingTraces = training.trace.get(i);
            const testTrace = test.trace.get(i);
            let kdeSum = 0;
            const bandwidth = Statistics.bandwidthScott(matrix(trainingTraces));

            for(const trainingTrace of trainingTraces){
                const traceDifference = Arrays.subtract(testTrace[0], trainingTrace);
                kdeSum += Statistics.multivariateGaussianKernel(traceDifference, bandwidth);
            }

            const density = kdeSum / trainingTraces.length;
            const lsa = -Math.log(density)

            if(lsa > 1){
                surpriseMap.set(i, true)
            }
            else{
                surpriseMap.set(i, false);
            }
        }
        return surpriseMap;
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
