import {ActivationTrace} from "./ActivationTrace";
import {zeros, det, exp, inv, Matrix, matrix, multiply, pow, subtract, transpose, index} from "mathjs";

export class SurpriseAdequacy {

    /*
    public static oneToManyLikelihood(reference: ActivationTrace[], test: ActivationTrace[]): number{
        let kernelSum = 0;
        const bandwidth = this.bandwidthScott(reference);
        for(const referenceTrace of reference){
            const refVector = matrix(referenceTrace.trace)
            const testVector = matrix(test[0].trace);
            const diff = subtract(testVector, refVector) as Matrix;
            kernelSum += this.gaussianKernel(diff, bandwidth);
        }
        return kernelSum / reference.length;
    }

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


    private static meanAndStd(x: number[]): [number, number] {
        // Check if all values are the same
        if(x.every(value => x[0] == value)){
            return [x[0], 0];
        }
        const n = x.length
        const mean = Number((x.reduce((a, acc) => acc + a) / n).toFixed(2));
        const meanDivs = x.map(x => Math.pow(x - mean, 2));
        const std = Math.sqrt(meanDivs.reduce((div, acc) => acc + div) / n);
        return [mean, std];
    }

    private static gaussianKernel(x: Matrix, bandwidth: Matrix): number{
        const left = pow(2*Math.PI, -0.5 * x.size()[0]);
        const middle = pow(det(bandwidth), -0.5)

        let right = multiply(-0.5, transpose(x));
        right = multiply(right, inv(bandwidth));
        right = multiply(right, x);
        right = exp(right as Matrix);
        return multiply(multiply(left, middle), right) as number;
    }

    private static bandwidthScott(data:ActivationTrace[]): Matrix{
        const nodeTraces = this.nodeTraceFromNetworkTrace(data).inputTrace;
        console.log("NEtworkTraces: ", data)
        console.log("NodeTraces: ", nodeTraces)
        const standardDeviations = []
        nodeTraces.forEach(((value) => standardDeviations.push(this.meanAndStd(value)[1])));
        console.log("StandardDeviations: ", standardDeviations)
        const bandwidth = zeros(standardDeviations.length, standardDeviations.length) as Matrix;
        for (let i = 0; i < standardDeviations.length; i++) {
            let scottValue = Math.pow(data.length, (-1 / (standardDeviations.length + 4))) * standardDeviations[i];
            scottValue = scottValue <= 0 ? 1: scottValue;
            bandwidth.subset(index(i, i), scottValue);
        }
        console.log("Bandwidth: ", bandwidth)
        console.log("INV: ", inv(bandwidth))
        return bandwidth;
    }

     */
}
