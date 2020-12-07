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

describe("List", () => {

    test("Get size of list", () => {
        let list = new List([1, 2, 3]);
        expect(list.size()).toBe(3);
    });

    test("Is list empty", () => {
        let list = new List([1, 2, 3]);
        let emptyList = new List([]);
        expect(list.isEmpty()).toBeFalsy();
        expect(emptyList.isEmpty()).toBeTruthy();
    });

    test("Add element to list", () => {
        let list = new List([1, 2, 3]);
        list.add(4);
        expect(list.size()).toBe(4);
    });

    test("Add array to list", () => {
        let list = new List([1, 2, 3]);
        list.addAll([4, 5]);
        expect(list.size()).toBe(5);
    });

    test("Add list to list", () => {
        let list = new List([1, 2, 3]);
        let list2 = new List([4, 5]);
        list.addList(list2);
        expect(list.size()).toBe(5);
    });

    test("Get element of list", () => {
        let list = new List([1, 2, 3]);
        expect(list.get(0)).toBe(1);
    });

    test("Clear list", () => {
        let list = new List([1, 2, 3]);
        list.clear();
        expect(list.size()).toBe(0);
    });

    test("Clone list", () => {
        let list = new List([1, 2, 3]);
        let clone = list.clone();
        list.clear();
        expect(clone.size()).toBe(3);
    });

    test("Remove element from list", () => {
        let list = new List([1, 2, 3]);
        list.remove(2);
        expect(list.get(1)).toBe(3);
    });

    test("List contains element", () => {
        let list = new List([1, 2, 3]);
        expect(list.contains(1)).toBeTruthy();
        expect(list.contains(4)).toBeFalsy();
    });

    test("Get sublist of list", () => {
        let list = new List([1, 2, 3]);
        let sublist = list.subList(0, 1);
        expect(sublist.size()).toBe(1);
        expect(sublist.get(0)).toBe(1);
    });

    test("Get distinct list", () => {
        let list = new List([1, 2, 3, 3]);
        let distinct = list.distinct();
        expect(distinct.size()).toBe(3);
    });

    test("Shuffle list", () => {
        let list = new List([0, 1, 2, 3, 4]);
        let changed = [false, false, false, false, false];
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
        let list = new List([4, 3, 2, 1]);
        list.sort((a, b) => a - b);
        expect(list.get(0)).toBe(1);
    });

    test("Reverse list", () => {
        let list = new List([1, 2, 3]);
        list.reverse();
        expect(list.get(0)).toBe(3);
        expect(list.get(1)).toBe(2);
        expect(list.get(2)).toBe(1);
    });

});

