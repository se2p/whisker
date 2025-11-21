import {NeuroevolutionUtil} from "../../../../../src/whisker/agentTraining/neuroevolution/misc/NeuroevolutionUtil";
import {expect} from "@jest/globals";

describe("NeuroevolutionUtil Tests", () => {

    test("Test RELU activation function", () => {
        expect(NeuroevolutionUtil.relu(Math.PI)).toEqual(Math.PI);
        expect(NeuroevolutionUtil.relu(-Math.PI)).toEqual(0);
    });

    test("Test sigmoid activation function", () => {
        expect(NeuroevolutionUtil.sigmoid(0, 1).toFixed(2)).toEqual("0.50");
        expect(NeuroevolutionUtil.sigmoid(-1, 1).toFixed(2)).toEqual("0.27");
        expect(NeuroevolutionUtil.sigmoid(1, 1).toFixed(2)).toEqual("0.73");
    });

    test("Test softmax activation function", () => {
        expect(NeuroevolutionUtil.softMax(2, [1,2,3]).toFixed(2)).toEqual("0.24");
        expect(NeuroevolutionUtil.softMax(2, [1,2,3])).toBeLessThan(NeuroevolutionUtil.softMax(3, [1,2,3]));
        expect(NeuroevolutionUtil.softMax(2, [1,2,3])).toBeGreaterThan(NeuroevolutionUtil.softMax(1, [1,2,3]));
        expect([1,2,3].reduce((a, b) => a + NeuroevolutionUtil.softMax(b, [1,2,3]), 0).toFixed(2)).toEqual("1.00");
    });

    test("Cosine similarity with equivalent maps", () => {
        const map1 = new Map<string, number>();
        const map2 = new Map<string, number>();
        map1.set("key1", 1);
        map1.set("key2", 2);
        map2.set("key1", 1);
        map2.set("key2", 2);
        expect(NeuroevolutionUtil.cosineSimilarityOfMaps(map1, map2)).toBeCloseTo(1);
    });

    test("Cosine similarity with dissimilar maps", () => {
        const map1 = new Map<string, number>();
        const map2 = new Map<string, number>();
        map1.set("key1", 0);
        map1.set("key2", 1);
        map2.set("key1", 2);
        map2.set("key2", 3);
        console.log(NeuroevolutionUtil.cosineSimilarityOfMaps(map1, map2));
        expect(NeuroevolutionUtil.cosineSimilarityOfMaps(map1, map2)).toBeCloseTo(0.83);
    });

    test("Cosine similarity with opposite values", () => {
        const map1 = new Map<string, number>();
        const map2 = new Map<string, number>();
        map1.set("key1", 1);
        map1.set("key2", 2);
        map2.set("key1", -1);
        map2.set("key2", -2);
        expect(NeuroevolutionUtil.cosineSimilarityOfMaps(map1, map2)).toBeCloseTo(-1);
    });

    test("Cosine similarity with different keys", () => {
        const map1 = new Map<string, number>();
        const map2 = new Map<string, number>();
        map1.set("key1", 1);
        map1.set("key2", 2);
        map2.set("key3", 1);
        map2.set("key4", 2);
        expect(NeuroevolutionUtil.cosineSimilarityOfMaps(map1, map2)).toEqual(0);
    });
});
