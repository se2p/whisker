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

import {TestGenerator} from './TestGenerator';
import {ScratchProject} from '../scratch/ScratchProject';
import {List} from '../utils/List';
import {WhiskerTest} from './WhiskerTest';
import {SearchAlgorithmProperties} from '../search/SearchAlgorithmProperties';
import {TestChromosomeGenerator} from '../testcases/TestChromosomeGenerator';

export class RandomTestGenerator implements TestGenerator {

    generateTests(project: ScratchProject) : List<WhiskerTest> {
        const testSuite = new List<WhiskerTest>();

        // TODO: Need properties for how many tests, and how long
        const searchAlgorithmProperties = new SearchAlgorithmProperties(0, 0, 0);
        const testGenerator = new TestChromosomeGenerator(searchAlgorithmProperties);

        // TODO: Repeat X times, as configured
        const testChromosome = testGenerator.get();
        testSuite.add(new WhiskerTest(testChromosome));

        // TODO: Handle statistics

        return testSuite;
    }

}
