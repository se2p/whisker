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
import {TestChromosome} from '../testcase/TestChromosome';
import {SearchAlgorithmFactory} from '../search/SearchAlgorithmFactory';
import {SearchAlgorithmProperties} from '../search/SearchAlgorithmProperties';
import {StatementCoverageFitness} from '../testcase/StatementFitnessFunction';
import {NotYetImplementedException} from '../core/exceptions/NotYetImplementedException';

/**
 * A many-objective search algorithm can generate tests
 * for all coverage objectives at the same time.
 */
export class ManyObjectiveTestGenerator implements TestGenerator {

    private searchAlgorithmProperties: SearchAlgorithmProperties<any>;

    setSearchAlgorithmProperties(properties: SearchAlgorithmProperties<any>) {
        this.searchAlgorithmProperties = properties;
    }

    generateTests(project: ScratchProject): List<WhiskerTest> {
        // eslint-disable-next-line no-unused-vars
        const fitnessFunctions = this._extractCoverageGoals(project);
        const searchFactory = new SearchAlgorithmFactory<TestChromosome>();
        // TODO: Where do the properties come from?
        const searchAlgorithmProperties = new SearchAlgorithmProperties(0, 0, 0);
        searchFactory.configureSearchAlgorithm(searchAlgorithmProperties);

        // TODO: Ensure this is a many-objective algorithm taking all goals
        const searchAlgorithm = searchFactory.instantiateSearchAlgorithm();
        // TODO: Assuming there is at least one solution?
        const testChromosomes = searchAlgorithm.findSolution();

        const testSuite = new List<WhiskerTest>();
        for (const testChromosome of testChromosomes) {
            testSuite.add(new WhiskerTest(testChromosome));
        }

        // TODO: Handle statistics

        return testSuite;
    }

    // eslint-disable-next-line no-unused-vars
    _extractCoverageGoals(project: ScratchProject): List<StatementCoverageFitness> {
        // TODO: Shared with IterativeSearchBasedTestGenerator, probably best to extract
        throw new NotYetImplementedException();
    }
}
