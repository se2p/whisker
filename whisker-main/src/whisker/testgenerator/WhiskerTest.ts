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

import {TestChromosome} from '../testcase/TestChromosome';
import {JavaScriptConverter} from "../testcase/JavaScriptConverter";
import {WhiskerAssertion} from "./assertions/WhiskerAssertion";
import assert from "assert";

/**
 * Internal representation of a test case such that we
 * can write them to a file. Search functionality is thus
 * retrieving a JavaScript representation in Whisker
 * format.
 */
export class WhiskerTest {

    private readonly _chromosome: TestChromosome

    private _assertions = new Map<number, WhiskerAssertion[]>();

    // TODO: Could also use a static factory to convert from TestChromosome?
    // eslint-disable-next-line no-unused-vars
    constructor(test: TestChromosome) {
        this._chromosome = test;
    }

    get chromosome(): TestChromosome {
        return this._chromosome;
    }

    get assertions(): Map<number, WhiskerAssertion[]> {
        return this._assertions;
    }

    getAssertionsAt(position: number): WhiskerAssertion[] {
        if (this._assertions.has(position)) {
            return this._assertions.get(position);
        } else {
            return [];
        }
    }


    addAssertion(position: number, assertion: WhiskerAssertion):void {
        if (!this._assertions.has(position)) {
            this._assertions.set(position, [assertion]);
        } else {
            this._assertions.get(position).push(assertion);
        }
    }

    /**
     * JavaScript code that can be executed with the regular Whisker UI
     */
    toJavaScriptCode(): string {
        const jsConverter = new JavaScriptConverter();
        return jsConverter.getText(this);
    }

    public toString = () : string => {
        assert(this._chromosome.trace != null);
        let text = "";
        let position = 0;
        for (const {event} of this._chromosome.trace.events) {
            text += event.toString() + "\n";
            for (const assertion of this.getAssertionsAt(position)) {
                text += assertion.toString() + "\n";
            }
            position++;
        }

        return text;
    }

    getEventsCount(): number {
        return this._chromosome.getNumEvents();
    }
}
