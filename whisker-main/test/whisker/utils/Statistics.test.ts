import Statistics from "../../../src/whisker/utils/Statistics";
import {matrix, identity, Matrix, index} from "mathjs";
import {expect} from "@jest/globals";

describe("Distributions", () => {

    let equalValues;
    let differentValues;

    beforeEach(() => {
        equalValues = [10, 10, 10, 10];
        differentValues = [10, 0, 2, 3, 12, 5, 17];
    })

    test("Mean with equal values", () => {
        expect(Statistics.mean(equalValues)).toBe(10);
    });

    test("Mean with different values", () => {
        expect(Statistics.mean(differentValues)).toBe(7);
    });

    test("Variance with equal values", () => {
        expect(Statistics.variance(equalValues)).toBe(0);
    });

    test("Variance with different values", () => {
        expect(Math.round(Statistics.variance(differentValues) * 100) / 100).toBe(32.57);
    });

    test("Standard deviation with equal values", () => {
        expect(Statistics.std(equalValues)).toBe(0);
    });

    test("Standard deviation with different values", () => {
        expect(Math.round(Statistics.std(differentValues) * 100) / 100).toBe(5.71);
    });

    test("Median calculation with even length", () => {
        const testValues = [1, 2, 3, 4];
        expect(Statistics.median(testValues)).toBe(2.5);
    });

    test("Median calculation with odd length", () => {
        const testValues = [1, 2, 3, 4, 5];
        expect(Statistics.median(testValues)).toBe(3);
    });

    test("Median with equal values", () => {
        expect(Statistics.median(equalValues)).toBe(equalValues[0]);
    });

    test("Interquartile range calculation", () => {
        const testValues = [1, 2, 3, 4, 5];
        expect(Statistics.iqr(testValues)).toBe(3);
    });

    test("Interquartile range with equal values", () => {
        expect(Statistics.iqr(equalValues)).toBe(0);
    });

    test("Multivariate Gaussian Kernel with identity matrix", () => {
        const testVector = [0.1, 0.2, 0.3];
        const bandwidth = identity(testVector.length) as Matrix;
        const gaussKernel = Statistics.multivariateGaussianKernel(testVector, bandwidth);
        expect(Math.round(gaussKernel * 100) / 100).toBe(0.06);
    });

    test("Test scott bandwidth", () => {
        const dataMatrix = matrix([[0, 1.6], [0.4, 2], [0.2, 1.8]]);
        const scottBandwidth = Statistics.multivariateBandwidthScott(dataMatrix);
        // We should only get values > 0 on the diagonal of the Matrix.
        expect(scottBandwidth.subset(index(0, 0))).toBeGreaterThan(0);
        expect(scottBandwidth.subset(index(1, 1))).toBeGreaterThan(0);
        expect(scottBandwidth.subset(index(0, 1))).toBe(0);
        expect(scottBandwidth.subset(index(1, 0))).toBe(0);
    });
});
