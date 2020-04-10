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

import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';
import {WhiskerTest} from './WhiskerTest';
import {List} from '../utils/List';

export class TestSuiteWriter {

    writeTests(fileName: string, tests: List<WhiskerTest>): void {
        const fileContents = this._getFileContents(tests);
        // TODO: Write fileContents to file with name fileName
        throw new NotYetImplementedException();
    }

    _getFileContents(tests: List<WhiskerTest>): string {
        let fileContents = this._getHeader();

        for(const test of tests) {
            fileContents += test.toJavaScriptCode();
        }

        fileContents += this._getFooter();

        return fileContents;
    }

    _getHeader(): string {
        throw new NotYetImplementedException();
    }

    _getFooter(): string {
        throw new NotYetImplementedException();
    }
}
