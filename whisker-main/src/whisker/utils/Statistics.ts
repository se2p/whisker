import {ScratchEvent} from "../testcase/events/ScratchEvent";
import Arrays from "./Arrays";

/**
 * Utility methods for calculating all sorts of data distribution metrics.
 */
export default class Statistics {

    /**
     * Calculates the mean of a given number array.
     * @param array of numbers.
     * @returns mean of provided numbers array.
     */
    public static mean(array: Readonly<number[]>): number {
        return array.reduce((a, acc) => acc + a) / array.length;
    }

    /**
     * Calculates the variance of a given number array.
     * @param array of numbers.
     * @returns variance of provided numbers array.
     */
    public static variance(array: Readonly<number[]>): number {
        const mean = this.mean(array);
        const meanDivs = array.map(x => Math.pow(x - mean, 2));
        return meanDivs.reduce((meanDiv, acc) => acc + meanDiv) / array.length;
    }

    /**
     * Calculates the standard deviation of a given number array.
     * @param array of numbers.
     * @returns standard deviation of provided numbers array.
     */
    public static std(array: Readonly<number[]>): number {
        return Math.sqrt(this.variance(array));
    }

    /**
     * Calculates the median of a given number array.
     * @param array of numbers.
     * @returns median of provided numbers array.
     */
    public static median(array: Readonly<number[]>): number {
        const sorted = [...array].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    }

    /**
     * Calculates the Inter-quartile range (IQR) of a given number array.
     * @param array of numbers.
     * @returns IQR of provided numbers array.
     */
    public static iqr(array: Readonly<number[]>): number {
        const sorted = [...array].sort((a, b) => a - b);

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

    /**
     * Gaussian Kernel function.
     * @param x parameter for kernel function.
     * @returns result of applying the kernel function to the parameter value x.
     */
    public static gaussianKernel(x: number): number {
        return (1 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x, 2));
    }

    /**
     * Calculates the bandwidth for the KDE using Silverman's rule of thumb. Should only be used for normal
     * distributions!
     * @param samples from which a bandwidth value should be derived.
     * @returns bandwidth for the given samples assuming a normal distribution.
     */
    public static silvermanRuleOfThumb(samples: Readonly<number[]>): number {
        const std = this.std(samples);
        const iqr = this.iqr(samples);
        return 0.9 * Math.min(std, iqr / 1.34) * Math.pow(samples.length, -0.2);
    }

    /**
     * Calculates the Levenshtein Distance between chunks of ScratchEvents.
     * @param a source chunk
     * @param b target chunk
     * @param chunkSize size of chunks
     * @returns Levenshtein Distance across all chunks.
     */
    public static levenshteinDistanceEventsChunks(a: ScratchEvent[], b: ScratchEvent[], chunkSize: number): number {
        const sourceChunks = Arrays.chunk(a, chunkSize);
        const targetChunks = Arrays.chunk(b, chunkSize);
        let distances: number[];
        if (sourceChunks.length > targetChunks.length) {
            distances = sourceChunks.map((value, index) =>
                this.levenshteinDistanceEvents(value, targetChunks[index]));
        } else {
            distances = targetChunks.map((value, index) =>
                this.levenshteinDistanceEvents(value, sourceChunks[index]));
        }
        return distances.reduce((pV, cV) => pV + cV, 0);
    }

    /**
     * Calculates the Levenshtein Distance between two arrays of ScratchEvents.
     * https://gist.github.com/andrei-m/982927
     * @param a the source string
     * @param b the target string
     * @returns number representing the Levenshtein distance between the input arrays.
     */
    public static levenshteinDistanceEvents(a: ScratchEvent[], b: ScratchEvent[]): number {
        const aStr = a?.map((event) => event.toJavaScript());
        const bStr = b?.map((event) => event.toJavaScript());
        return Statistics.levenshteinDistance(aStr, bStr);
    }

    public static levenshteinDistance<T extends string | string[]>(a: T, b: T): number {
        // Trivial case: If either one of both strings has a length of 0 return the length of the other string.
        if (!a || a.length === 0) return b.length;
        if (!b || b.length === 0) return a.length;

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
                if (b[i - 1] == a[j - 1]) {
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
}

