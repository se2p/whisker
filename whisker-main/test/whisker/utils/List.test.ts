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

import {List} from "../../../src/whisker/utils/List";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";

describe("List", () => {

    let list: List<number>

    beforeEach(() => {
        list = new List<number>([1, 2, 3])
    })

    test("Get size of list", () => {
        expect(list.size()).toBe(3);
    });

    test("Is list empty", () => {
        const emptyList = new List([]);
        expect(list.isEmpty()).toBeFalsy();
        expect(emptyList.isEmpty()).toBeTruthy();
    });

    test("Add element to list", () => {
        list.add(4);
        expect(list.size()).toBe(4);
    });

    test("Insert element to list", () => {
        list.insert(4, 1)
        expect(list.getElements()).toEqual([1, 4, 2, 3]);
    });

    test("Replace oldElement with a new one", () => {
        const wasSuccessFull = list.replace(2, 5);
        expect(wasSuccessFull).toBeTruthy();
        expect(list.getElements()).toEqual([1, 5, 3]);
    });

    test("Try to replace a non existing oldElement with a new one", () => {
        const wasSuccessFull = list.replace(-1, 5);
        expect(wasSuccessFull).toBeFalsy();
        expect(list.getElements()).toEqual([1,2,3]);
    });

    test("Replace element given an index", () => {
        const wasSuccessFull = list.replaceAt(4, 1);
        expect(wasSuccessFull).toBeTruthy();
        expect(list.getElements()).toEqual([1, 4, 3]);
    });

    test("Try to replace element given a non valid index", () => {
        const wasSuccessFull = list.replaceAt(4, -1);
        expect(wasSuccessFull).toBeFalsy();
        expect(list.getElements()).toEqual([1, 2, 3]);
    });

    test("Add array to list", () => {
        list.addAll([4, 5]);
        expect(list.size()).toBe(5);
    });

    test("Add list to list", () => {
        const list2 = new List<number>([4, 5]);
        list.addList(list2);
        expect(list.size()).toBe(5);
    });

    test("Range function stepSize of 1", () =>{
        const rangeList = List.range(0, 10, 1);
        expect(rangeList.getElements().reduce((a, b) => a + b, 0)).toBe(45)
    })

    test("Range function stepSize of 100", () =>{
        const rangeList = List.range(0, 850, 100);
        expect(rangeList.getElements().reduce((a, b) => a + b, 0)).toBe(3600)
    })

    test("Get element of list", () => {
        expect(list.get(0)).toBe(1);
    });

    test("Filter list", () => {
        const list = new List([13,21,9,33,77,35,11,20,62,81])
        const filteredList = list.filter(value => value < 30);
        expect(filteredList.getElements()).toEqual([13,21,9,11,20]);
        expect(list.getElements()).toEqual([13,21,9,33,77,35,11,20,62,81])
    });

    test("Test find", () => {
        const keyPressEvent = new KeyPressEvent('left arrow')
        const list = new List([new MouseMoveEvent(), new WaitEvent(), new KeyPressEvent('left arrow')]);
        expect(list.find(event => event instanceof KeyPressEvent)).toEqual(keyPressEvent);
    });

    test("Test FindIndex", () => {
        const list = new List([new MouseMoveEvent(), new WaitEvent(), new KeyPressEvent('left arrow')]);
        expect(list.findIndex(event => event instanceof KeyPressEvent)).toEqual(2);
    });

    test("Test FindElement", () => {
        expect(list.findElement(2)).toEqual(1);
    });

    test("Clear list", () => {
        list.clear();
        expect(list.size()).toBe(0);
    });

    test("Clone list", () => {
        const clone = list.clone();
        list.clear();
        expect(clone.size()).toBe(3);
    });

    test("Remove element from list", () => {
        list.remove(2);
        expect(list.get(1)).toBe(3);
    });

    test("Remove element from list given an index", () => {
        list.removeAt(1);
        expect(list.get(1)).toBe(3);
    });

    test("List contains element", () => {
        expect(list.contains(1)).toBeTruthy();
        expect(list.contains(4)).toBeFalsy();
    });

    test("Get sublist of list", () => {
        const sublist = list.subList(0, 1);
        expect(sublist.size()).toBe(1);
        expect(sublist.get(0)).toBe(1);
    });

    test("Get distinct list", () => {
        const list = new List([1, 2, 3, 3]);
        const distinct = list.distinct();
        expect(distinct.size()).toBe(3);
    });

    test("Shuffle list", () => {
        const list = new List([0, 1, 2, 3, 4]);
        const changed = [false, false, false, false, false];
        for (let i = 0; i < 100; i++) {
            list.shuffle();
            for (let position = 0; position < list.size(); position++) {
                if (list.get(position) != position) {
                    changed[position] = true;
                }
            }
        }
        expect(changed.includes(false)).toBeFalsy();
    });

    test("Sort list", () => {
        const list = new List<number>([4, 3, 2, 1]);
        list.sort((a, b) => a - b);
        expect(list.get(0)).toBe(1);
    });

    test("Reverse list", () => {
        list.reverse();
        expect(list.get(0)).toBe(3);
        expect(list.get(1)).toBe(2);
        expect(list.get(2)).toBe(1);
    });

    test("Distinct objects", () => {
        const list = new List([new ClickStageEvent(), new ClickStageEvent(), new ClickStageEvent()]);
        const distinct = list.distinctObjects();
        expect(distinct.size()).toBe(1);
    });

    test("Test map", () => {
        const expected = new List<number>();
        for(const x of list)
            expected.add(x * 2);
        expect(list.map(x => x * 2)).toEqual(expected);
    });

    test("Test toString", () => {
        expect(list.toString()).toEqual("1,2,3");
    });

});

