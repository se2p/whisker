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
import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';
import {List} from "../utils/List";
import {TestExecutor} from "../testcase/TestExecutor";
import {TextConverter} from "../testcase/TextConverter";
import {Container} from "../utils/Container";
import {JavaScriptConverter} from "../testcase/JavaScriptConverter";

/**
 * Internal representation of a test case such that we
 * can write them to a file. Search functionality is thus
 * retrieving a JavaScript representation in Whisker
 * format.
 */
export class WhiskerTest {

    private _chromosome: TestChromosome


    // TODO: Could also use a static factory to convert from TestChromosome?
    // eslint-disable-next-line no-unused-vars
    constructor(test: TestChromosome) {
        this._chromosome = test;
    }

    get chromosome(): TestChromosome {
        return this._chromosome;
    }

    /**
     * JavaScript code that can be executed with the regular Whisker UI
     */
    toJavaScriptCode(): string {
        const executor = new TestExecutor(Container.vm);
        const textConverter = new JavaScriptConverter(executor);
        return textConverter.getText(this._chromosome);    }

    toString(): string {
        const executor = new TestExecutor(Container.vm);
        const textConverter = new TextConverter(executor);
        return textConverter.getText(this._chromosome);
    }
}
