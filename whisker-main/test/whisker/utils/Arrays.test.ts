/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import Arrays from "../../../src/whisker/utils/Arrays";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {MouseDownEvent} from "../../../src/whisker/testcase/events/MouseDownEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";

describe("Arrays", () => {

    let array: number[];

    beforeEach(() => {
        array = [1, 2, 3];
    });

    test("Add array to list", () => {
        Arrays.addAll(array, [4, 5]);
        expect(array.length).toBe(5);
    });

    test("Is array empty", () => {
        const empty = [];
        expect(Arrays.isEmpty(array)).toBeFalsy();
        expect(Arrays.isEmpty(empty)).toBeTruthy();
    });

    test("Add element to array", () => {
        array.push(4);
        expect(array.length).toBe(4);
    });

    test("Insert element to array", () => {
        Arrays.insert(array, 4, 1);
        expect(array).toEqual([1, 4, 2, 3]);
    });

    test("Replace oldElement with a new one", () => {
        const wasSuccessFull = Arrays.replace(array, 2, 5);
        expect(wasSuccessFull).toBeTruthy();
        expect(array).toEqual([1, 5, 3]);
    });

    test("Try to replace a non existing oldElement with a new one", () => {
        const wasSuccessFull = Arrays.replace(array, -1, 5);
        expect(wasSuccessFull).toBeFalsy();
        expect(array).toEqual([1, 2, 3]);
    });

    test("Replace element given an index", () => {
        const wasSuccessFull = Arrays.replaceAt(array, 4, 1);
        expect(wasSuccessFull).toBeTruthy();
        expect(array).toEqual([1, 4, 3]);
    });

    test("Try to replace element given a non valid index", () => {
        const wasSuccessFull = Arrays.replaceAt(array, 4, -1);
        expect(wasSuccessFull).toBeFalsy();
        expect(array).toEqual([1, 2, 3]);
    });

    test("Test FindElement", () => {
        expect(Arrays.findElement(array, 2)).toEqual(1);
    });

    test("Clear array", () => {
        Arrays.clear(array);
        expect(array.length).toBe(0);
    });

    test("Clone array", () => {
        const clone = Arrays.clone(array);
        Arrays.clear(array);
        expect(clone.length).toBe(3);
    });

    test("Remove element from array", () => {
        Arrays.remove(array, 2);
        expect(array[1]).toBe(3);
    });

    test("Remove element from array given an index", () => {
        Arrays.removeAt(array, 1);
        expect(array[1]).toBe(3);
    });

    test("Get distinct array", () => {
        const array = [1, 2, 3, 3];
        const distinct = Arrays.distinct(array);
        expect(distinct.length).toBe(3);
    });

    test("Shuffle array", () => {
        const array = [0, 1, 2, 3, 4];
        const changed = [false, false, false, false, false];
        for (let i = 0; i < 100; i++) {
            Arrays.shuffle(array);
            for (let position = 0; position < array.length; position++) {
                if (array[position] != position) {
                    changed[position] = true;
                }
            }
        }
        expect(changed.includes(false)).toBeFalsy();
    });

    test("Chunk array", () =>{
        const array = [1,2,3,4,5,6,7];
        const chunkArray = Arrays.chunk(array, 3);
        expect(chunkArray.length).toBe(3);
        expect(chunkArray[0]).toStrictEqual([1,2,3]);
        expect(chunkArray[1]).toStrictEqual([4,5,6]);
        expect(chunkArray[2]).toStrictEqual([7]);
    });

    test("Sort array", () => {
        const array = [4, 3, 2, 1];
        Arrays.sort(array);
        expect(array[0]).toBe(1);
        expect(array[1]).toBe(2);
        expect(array[2]).toBe(3);
        expect(array[3]).toBe(4);
    });

    test("Distinct objects", () => {
        const array = [new ClickStageEvent(), new ClickStageEvent(), new ClickStageEvent()];
        const distinct = Arrays.distinctObjects(array);
        expect(distinct.length).toBe(1);
    });

    test("Distinct objects by custom defined comparator", () => {
        const comparator = (a:ScratchEvent, b:ScratchEvent) => a.stringIdentifier() === b.stringIdentifier();
        const array = [new ClickStageEvent(), new MouseDownEvent(1), new MouseDownEvent(1),
            new MouseMoveEvent(2,1), new MouseMoveEvent(2, 1), new MouseMoveEvent(10, 10)];
        const distinct = Arrays.distinctByComparator(array, comparator);
        expect(distinct.length).toBe(3);
        expect(distinct[0].stringIdentifier()).toBe(array[0].stringIdentifier());
        expect(distinct[1].stringIdentifier()).toBe(array[1].stringIdentifier());
        expect(distinct[2].stringIdentifier()).toBe(array[3].stringIdentifier());
    });

    test("Range function stepSize of 1", () => {
        const rangeArray = Arrays.range(0, 10, 1);
        expect(rangeArray.reduce((a, b) => a + b, 0)).toBe(45);
    });

    test("Range function stepSize of 100", () => {
        const rangeArray = Arrays.range(0, 850, 100);
        expect(rangeArray.reduce((a, b) => a + b, 0)).toBe(3600);
    });


    test("Create random Array in range", () =>{
        const minValue = 10;
        const maxValue = 30;
        const length = 100;
        const array = Arrays.getRandomArray(minValue, maxValue, length);
        expect(Math.min(...array)).toBeGreaterThanOrEqual(minValue);
        expect(Math.max(...array)).toBeLessThanOrEqual(maxValue);
        expect(array.length).toBe(length);
    });

    test("Subtract two arrays, e.g. vectors of equal size", () => {
        const subtrahend = [1, 0, 5];
        const expected = [0, 2, -2];
        expect(Arrays.subtract(array, subtrahend)).toStrictEqual(expected);
    });

    test("Subtract two arrays, e.g. vectors of different sizes with a bigger minuend", () => {
        const subtrahend = [1, 0];
        const expected = [0, 2, 3];
        expect(Arrays.subtract(array, subtrahend)).toStrictEqual(expected);
    });

    test("Subtract two arrays, e.g. vectors of different sizes with a bigger subtrahend", () => {
        const subtrahend = [1, 0, 5, 10];
        const expected = [0, 2, -2];
        expect(Arrays.subtract(array, subtrahend)).toStrictEqual(expected);
    });

    test("Scalar multiplication", () => {
        const expected = [3, 6, 9];
        expect(Arrays.scalarProduct(array, 3)).toStrictEqual(expected);
    });

    test("Arrays.last returns last element from array", () => {
        const actual = Arrays.last(array);
        const expected = array[array.length - 1];
        expect(actual).toBe(expected);
    });

    test("Arrays.last does not modify source array", () => {
        const array = [2, 1, 5, 3, 4, 7, 9, 0, 8, 6];
        const copy = [...array];
        Arrays.last(array);
        expect(array).toStrictEqual(copy);
    });
});
