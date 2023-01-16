import Statistics from "../../../src/whisker/utils/Statistics";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";

describe("Statistics", () => {

    let equalValues;
    let differentValues;

    beforeEach(() => {
        equalValues = [10, 10, 10, 10];
        differentValues = [10, 0, 2, 3, 12, 5, 17];
    });

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

    test("Inter-quartile range calculation", () => {
        const testValues = [1, 2, 3, 4, 5];
        expect(Statistics.iqr(testValues)).toBe(3);
    });

    test("Inter-quartile range with equal values", () => {
        expect(Statistics.iqr(equalValues)).toBe(0);
    });

    test("Inter-quartile range with missing quartile", () => {
        const testValues = [1, 1, 1, 1, 10];
        expect(Statistics.iqr(testValues)).toBe(1);
    });

    test("Gaussian Kernel function", () => {
        expect(Statistics.gaussianKernel(0).toFixed(1)).toBe("0.4");
    });

    test("Silverman's rule of thumb", () => {
        expect(Statistics.silvermanRuleOfThumb([0, 1, 2, 3, 4, 5]).toFixed(1)).toBe("1.1");
    });

    test("Levenshtein Distance Trivial Case", () => {
        const testArray = [new MouseMoveEvent(1, 2), new WaitEvent(), new KeyPressEvent('left arrow')];
        expect(Statistics.levenshteinDistanceEvents(testArray, [])).toBe(testArray.length);
        expect(Statistics.levenshteinDistanceEvents([], testArray)).toBe(testArray.length);
    });

    test("Levenshtein Distance Non-Trivial Case", () => {
        const source = [new MouseMoveEvent(1, 2), new MouseMoveEvent(3, 4), new WaitEvent(),
            new KeyPressEvent('left arrow')];
        const target = [new MouseMoveEvent(2, 1), new MouseMoveEvent(1, 2), new WaitEvent(),
            new KeyPressEvent('right arrow')];

        // The metric is symmetric
        expect(Statistics.levenshteinDistanceEvents(source, target)).toBe(3);
        expect(Statistics.levenshteinDistanceEvents(target, source)).toBe(3);

        // Triangle Equation must hold.
        const third = [new ClickStageEvent()];
        const leftSide = Statistics.levenshteinDistanceEvents(source, target);
        const rightSide = Statistics.levenshteinDistanceEvents(source, third) +
            Statistics.levenshteinDistanceEvents(target, third);
        expect(leftSide).toBeLessThanOrEqual(rightSide);
    });

    test("Levenshtein Distance Chunks", () => {
        const testArray = [new MouseMoveEvent(1, 2), new WaitEvent(), new KeyPressEvent('left arrow')];
        expect(Statistics.levenshteinDistanceEventsChunks(testArray, [], 2)).toBe(testArray.length);
        expect(Statistics.levenshteinDistanceEventsChunks([], testArray, 2)).toBe(testArray.length);
    });

    test("Levenshtein Distance Non-Trivial Case", () => {
        const source = [new MouseMoveEvent(1, 2), new MouseMoveEvent(3, 4), new WaitEvent(),
            new KeyPressEvent('left arrow')];
        const target = [new MouseMoveEvent(2, 1), new MouseMoveEvent(1, 2), new WaitEvent(),
            new KeyPressEvent('right arrow'), new ClickStageEvent()];

        // The metric is symmetric
        expect(Statistics.levenshteinDistanceEventsChunks(source, target, 3)).toBe(4);
        expect(Statistics.levenshteinDistanceEventsChunks(target, source, 3)).toBe(4);

        // Triangle Equation must hold.
        const third = [new ClickStageEvent()];
        const leftSide = Statistics.levenshteinDistanceEventsChunks(source, target, 2);
        const rightSide = Statistics.levenshteinDistanceEventsChunks(source, third, 2) +
            Statistics.levenshteinDistanceEventsChunks(target, third, 2);
        expect(leftSide).toBeLessThanOrEqual(rightSide);
    });
});

describe('Levenshtein distance', () => {
    it('is 0 for equal words', () => {
        const word = 'hello, world!';
        expect(Statistics.levenshteinDistance(word, word)).toStrictEqual(0);
    });

    it('is the difference in length for a string and a substring', () => {
        const s1 = 'substring';
        const s2 = 'string';
        expect(Statistics.levenshteinDistance(s1, s2)).toStrictEqual(s1.length - s2.length);
    });

    it('is the length of the non-empty string given the empty string', () => {
        const s1 = '';
        const s2 = 'Ski Ba Bop Ba Dop Bop';
        expect(Statistics.levenshteinDistance(s1, s2)).toStrictEqual(s2.length);
    });

    it('at most the length of the longer string', () => {
        const s1 = 'yes';
        const s2 = 'no';
        expect(Statistics.levenshteinDistance(s1, s2)).toStrictEqual(Math.max(s1.length, s2.length));
    });

    const table = [
        [1, "test", "jest"],      // replace
        [4, "test", "nesting"],   // replace + insert
        [1, "test", "est"],       // delete
        [2, "test", "est."],      // delete + insert
        [3, "test", "tbd"],       // delete + replace
    ];

    it.each(table)('is %d for "%s" and "%s"', (len: number, s1: string, s2: string) => {
        expect(Statistics.levenshteinDistance(s1, s2)).toStrictEqual(len);
    });
});
