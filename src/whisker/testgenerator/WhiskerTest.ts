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

import {TestChromosome} from '../testcases/TestChromosome';
import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';

/**
 * Internal representation of a test case such that we
 * can write them to a file. Main functionality is thus
 * retrieving a JavaScript representation in Whisker
 * format.
 */
export class WhiskerTest {

    // TODO: Could also use a static factory to convert from TestChromosome?
    // eslint-disable-next-line no-unused-vars
    constructor (test: TestChromosome) {
        throw new NotYetImplementedException();
    }

    /**
     * JavaScript code that can be executed with the regular Whisker UI
     */
    toJavaScriptCode (): string {
        throw new NotYetImplementedException();
    }
}
