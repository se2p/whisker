import {column, det, exp, inv, Matrix, multiply, pow, transpose, zeros, flatten, index} from "mathjs";

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

    public static median(values: number[]): number {
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    }

    public static iqr(values: number[]): number {
        const sorted = [...values].sort((a, b) => a - b);

        // Check if all values are equal.
        if (sorted.every((value, _, array) => value == array[0])) {
            return 0;
        }

        const q2 = this.median(sorted);
        const upperQuartile = [];
        const lowerQuartile = [];
        for (const value of sorted) {
            if (value < q2) {
                lowerQuartile.push(value);
            } else if (value > q2) {
                upperQuartile.push(value);
            }
        }

        const q1 = this.median(lowerQuartile);
        const q3 = this.median(upperQuartile);
        return q3 - q1;
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

    public static gaussianKernel(x:number): number{
        return (1 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x, 2));
    }

    public static bandwidthSilverman(values:number[]):number{
        const std = this.std(values);
        const iqr = this.iqr(values);
        return 0.9 * Math.min(std, iqr / 1.34) * Math.pow(values.length, -0.2);
    }

    public static multivariateBandwidthScott(values: Matrix): Matrix {
        const populations = values.size()[1]
        const observationsPerPopulation = values.size()[0];
        const scottMatrix = zeros(populations, populations) as Matrix;
        for (let i = 0; i < populations; i++) {
            const samplePopulation = flatten(column(values, i)).toArray() as number[];
            const standardDeviation = this.std(samplePopulation);
            const scottValue = Math.max(Math.pow(observationsPerPopulation, (-1 / (populations + 4))) * standardDeviation, 0.0001);
            scottMatrix.subset(index(i, i), Math.sqrt(scottValue));
        }
        return scottMatrix;
    }
}

