import {column, det, exp, inv, Matrix, multiply, pow, transpose, zeros, flatten, index} from "mathjs";
import {ScratchEvent} from "../testcase/events/ScratchEvent";
import Arrays from "./Arrays";

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

        if (upperQuartile.length == 0 || lowerQuartile.length == 0) {
            return 1;
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

    public static gaussianKernel(x: number): number {
        return (1 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x, 2));
    }

    public static bandwidthSilverman(values: number[]): number {
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

    /**
     * Calculates the Levenshtein Distance between two arrays of ScratchEvents.
     * https://gist.github.com/andrei-m/982927
     * @param a the source string
     * @param b the target string
     * @returns number representing the Levenshtein distance between the input arrays.
     */
    public static levenshteinDistanceEvents(a: ScratchEvent[], b: ScratchEvent[]): number {
        // Trivial case: If either one of both strings has a length of 0 return the length of the other string.
        if (a === undefined || a.length == 0) return b.length;
        if (b === undefined || b.length == 0) return a.length;

        // Saves a matrix of required operations between substrings having a length of the given row/column indices.
        const matrix = [];

        // Add values for the trivial cases in the first row/column
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1].toJavaScript() == a[j - 1].toJavaScript()) {
                    matrix[i][j] = matrix[i - 1][j - 1];    // no operation required
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution operation
                        Math.min(matrix[i][j - 1] + 1, // insertion operation
                            matrix[i - 1][j] + 1)); // deletion operation
                }
            }
        }

        return matrix[b.length][a.length];
    }

    public static levenshteinDistanceEventsChunks(a: ScratchEvent[], b: ScratchEvent[], chunkSize: number): number {
        const sourceChunks = Arrays.chunk(a, chunkSize);
        const targetChunks = Arrays.chunk(b, chunkSize);
        let distances: number[];
        if (sourceChunks.length > targetChunks.length) {
            distances = sourceChunks.map((value, index) =>
                this.levenshteinDistanceEvents(value, targetChunks[index]))
        } else {
            distances = targetChunks.map((value, index) =>
                this.levenshteinDistanceEvents(value, sourceChunks[index]))
        }
        return distances.reduce((pV, cV) => pV + cV, 0);
    }
}

