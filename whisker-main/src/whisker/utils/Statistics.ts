import {column, det, exp, inv, Matrix, multiply, pow, transpose, zeros, flatten, subset, index} from "mathjs";

/**
 * Provides useful utility methods for calculating all sorts of data distribution metrics.
 */
export default class Statistics {

    public static mean(x: number[]): number {
        return x.reduce((a, acc) => acc + a) / x.length;
    }

    public static variance(x: number[]): number {
        const mean = this.mean(x);
        const meanDivs = x.map(x => Math.pow(x - mean, 2));
        return meanDivs.reduce((meanDiv, acc) => acc + meanDiv) / x.length;
    }

    public static std(x: number[]): number {
        return Math.sqrt(this.variance(x));
    }

    public static multivariateGaussianKernel(x: number[], bandwidth: Matrix): number {
        const left = pow(2 * Math.PI, -0.5 * x.length);
        const middle = pow(det(bandwidth), -0.5)

        let right = multiply(-0.5, transpose(x));
        right = multiply(right, inv(bandwidth));
        right = multiply(right, x);
        right = exp(right as Matrix);
        return multiply(multiply(left, middle), right) as number;
    }


    public static bandwidthScott(values: Matrix): Matrix{
        const populations = values.size()[1]
        const observationsPerPopulation = values.size()[0];
        const scottMatrix = zeros(populations, populations) as Matrix;
        for (let i = 0; i < populations; i++) {
            const samplePopulation = flatten(column(values, i)).toArray() as number[];
            const standardDeviation = this.std(samplePopulation);
            const scottValue =  Math.pow(observationsPerPopulation, (-1 / (populations + 4))) * standardDeviation;
            scottMatrix.subset(index(i, i), Math.sqrt(scottValue));
        }
        return scottMatrix;
    }
}

